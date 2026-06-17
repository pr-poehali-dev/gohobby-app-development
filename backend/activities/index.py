import json
import os
import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}


def resp(body, status=200):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def get_user(cur, token):
    if not token:
        return None
    cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    """API для активностей GoHobby: лента, создание, свайп (участие/пропуск), счётчик мест."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return resp({})

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'feed')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    user_id = get_user(cur, token)

    # --- FEED (GET ?action=feed) ---
    # Возвращает активности, которые:
    # 1. не созданы текущим пользователем
    # 2. пользователь ещё не свайпнул (ни в participants, ни в skips)
    # 3. есть свободные места (spots_total - joined_count > 0)
    # 4. активны и дата >= сегодня
    if method == 'GET' and action == 'feed':
        if not user_id:
            cur.close(); conn.close()
            return resp({'error': 'unauthorized'}, 401)

        cur.execute("""
            SELECT
                a.id, a.hobby, a.description, a.activity_date, a.activity_time,
                a.place, a.spots_total, a.photo_url,
                u.name AS creator_name, u.avatar_url AS creator_avatar,
                (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id) AS joined_count
            FROM activities a
            JOIN users u ON u.id = a.creator_id
            WHERE a.is_active = TRUE
              AND a.creator_id != %s
              AND a.activity_date >= CURRENT_DATE
              AND a.id NOT IN (
                  SELECT activity_id FROM activity_participants WHERE user_id = %s
                  UNION
                  SELECT activity_id FROM activity_skips WHERE user_id = %s
              )
            HAVING (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id) < a.spots_total
            ORDER BY a.activity_date ASC, a.created_at DESC
            LIMIT 20
        """, (user_id, user_id, user_id))

        rows = cur.fetchall()
        cols = ['id', 'hobby', 'description', 'date', 'time', 'place', 'spots_total', 'photo_url',
                'creator_name', 'creator_avatar', 'joined_count']
        cards = []
        for row in rows:
            d = dict(zip(cols, row))
            d['spots_left'] = d['spots_total'] - int(d['joined_count'])
            cards.append(d)

        cur.close(); conn.close()
        return resp({'cards': cards})

    # --- SWIPE (POST ?action=join or ?action=skip) ---
    if method == 'POST' and action in ('join', 'skip'):
        if not user_id:
            cur.close(); conn.close()
            return resp({'error': 'unauthorized'}, 401)

        body = json.loads(event.get('body') or '{}')
        activity_id = body.get('activityId')
        if not activity_id:
            cur.close(); conn.close()
            return resp({'error': 'no_activity_id'}, 400)

        if action == 'skip':
            cur.execute(
                "INSERT INTO activity_skips (activity_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (activity_id, user_id)
            )
            conn.commit()
            cur.close(); conn.close()
            return resp({'ok': True, 'action': 'skipped'})

        # join: проверяем места
        cur.execute("""
            SELECT a.spots_total,
                   (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id) AS joined
            FROM activities a WHERE a.id = %s AND a.is_active = TRUE
        """, (activity_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return resp({'error': 'not_found'}, 404)

        spots_total, joined = row[0], int(row[1])
        if joined >= spots_total:
            cur.close(); conn.close()
            return resp({'error': 'full', 'message': 'Все места заняты'}, 409)

        cur.execute(
            "INSERT INTO activity_participants (activity_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (activity_id, user_id)
        )

        # Если после записи мест не осталось — помечаем слот неактивным
        new_joined = joined + 1
        if new_joined >= spots_total:
            cur.execute("UPDATE activities SET is_active = FALSE WHERE id = %s", (activity_id,))

        conn.commit()
        is_match = True  # в MVP считаем мэтч при любом join
        cur.close(); conn.close()
        return resp({'ok': True, 'action': 'joined', 'match': is_match, 'spotsLeft': spots_total - new_joined})

    # --- CREATE (POST ?action=create) ---
    if method == 'POST' and action == 'create':
        if not user_id:
            cur.close(); conn.close()
            return resp({'error': 'unauthorized'}, 401)

        body = json.loads(event.get('body') or '{}')
        hobby = body.get('hobby', '')
        description = body.get('description', '')
        date = body.get('date', '')
        time = body.get('time', '')
        place = body.get('place', '')
        spots = int(body.get('spots', 2))
        photo_url = body.get('photoUrl', None)

        if not all([hobby, description, date, time, place]):
            cur.close(); conn.close()
            return resp({'error': 'missing_fields'}, 400)

        cur.execute("""
            INSERT INTO activities (creator_id, hobby, description, activity_date, activity_time, place, spots_total, photo_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (user_id, hobby, description, date, time, place, spots, photo_url))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return resp({'ok': True, 'id': new_id})

    # --- MY ACTIVITIES (GET ?action=mine) ---
    if method == 'GET' and action == 'mine':
        if not user_id:
            cur.close(); conn.close()
            return resp({'error': 'unauthorized'}, 401)

        cur.execute("""
            SELECT a.id, a.hobby, a.description, a.activity_date, a.activity_time, a.place,
                   a.spots_total, a.is_active, a.photo_url,
                   (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id) AS joined_count
            FROM activities a
            WHERE a.creator_id = %s
            ORDER BY a.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        cols = ['id', 'hobby', 'description', 'date', 'time', 'place', 'spots_total', 'is_active', 'photo_url', 'joined_count']
        cur.close(); conn.close()
        return resp({'activities': [dict(zip(cols, r)) for r in rows]})

    cur.close(); conn.close()
    return resp({'error': 'unknown'}, 400)

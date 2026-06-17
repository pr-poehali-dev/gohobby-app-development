import json
import os
import psycopg2


def _cors(body, status=200):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
            'Content-Type': 'application/json',
        },
        'isBase64Encoded': False,
        'body': json.dumps(body),
    }


def _user_by_token(cur, token):
    if not token:
        return None
    cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    '''Профиль пользователя GoHobby: получение и сохранение имени, даты рождения, хобби и фото по токену сессии.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _cors({})

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    user_id = _user_by_token(cur, token)
    if not user_id:
        cur.close()
        conn.close()
        return _cors({'error': 'unauthorized'}, 401)

    if method == 'GET':
        cur.execute(
            "SELECT id, name, email, avatar_url, birth_date, hobbies, photos, rating FROM users WHERE id = %s",
            (user_id,),
        )
        u = cur.fetchone()
        cur.close()
        conn.close()
        return _cors({
            'id': u[0], 'name': u[1], 'email': u[2], 'avatar': u[3] or '',
            'birthDate': u[4].isoformat() if u[4] else None,
            'hobbies': u[5] or [], 'photos': u[6] or [], 'rating': float(u[7]),
        })

    if method in ('POST', 'PUT'):
        body = json.loads(event.get('body') or '{}')
        name = body.get('name')
        birth_date = body.get('birthDate')
        hobbies = body.get('hobbies', [])
        photos = body.get('photos', [])

        cur.execute(
            "UPDATE users SET name = COALESCE(%s, name), birth_date = %s, hobbies = %s, photos = %s WHERE id = %s",
            (name, birth_date if birth_date else None, hobbies, photos, user_id),
        )
        conn.commit()
        cur.close()
        conn.close()
        return _cors({'ok': True})

    cur.close()
    conn.close()
    return _cors({'error': 'method_not_allowed'}, 405)

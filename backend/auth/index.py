import json
import os
import secrets
import urllib.request
import urllib.parse
import psycopg2


def _cors(body, status=200):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
            'Content-Type': 'application/json',
        },
        'isBase64Encoded': False,
        'body': json.dumps(body),
    }


def handler(event: dict, context) -> dict:
    '''Вход через Яндекс ID: обменивает код авторизации на профиль пользователя и создаёт сессию.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _cors({})

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'config')

    client_id = os.environ.get('YANDEX_CLIENT_ID', '')
    client_secret = os.environ.get('YANDEX_CLIENT_SECRET', '')

    if action == 'config':
        return _cors({'clientId': client_id})

    if action == 'callback':
        body = json.loads(event.get('body') or '{}')
        code = body.get('code')
        if not code:
            return _cors({'error': 'no_code'}, 400)

        token_data = urllib.parse.urlencode({
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
        }).encode()
        req = urllib.request.Request('https://oauth.yandex.ru/token', data=token_data)
        with urllib.request.urlopen(req, timeout=10) as r:
            tok = json.loads(r.read().decode())
        access_token = tok.get('access_token')
        if not access_token:
            return _cors({'error': 'token_failed'}, 400)

        info_req = urllib.request.Request(
            'https://login.yandex.ru/info?format=json',
            headers={'Authorization': f'OAuth {access_token}'},
        )
        with urllib.request.urlopen(info_req, timeout=10) as r:
            info = json.loads(r.read().decode())

        yandex_id = str(info.get('id'))
        email = info.get('default_email') or ''
        name = info.get('real_name') or info.get('display_name') or 'Гость'
        avatar_id = info.get('default_avatar_id')
        avatar_url = f'https://avatars.yandex.net/get-yapic/{avatar_id}/islands-200' if avatar_id else ''

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE yandex_id = %s", (yandex_id,))
        row = cur.fetchone()
        if row:
            user_id = row[0]
        else:
            cur.execute(
                "INSERT INTO users (yandex_id, email, name, avatar_url) VALUES (%s, %s, %s, %s) RETURNING id",
                (yandex_id, email, name, avatar_url),
            )
            user_id = cur.fetchone()[0]

        session_token = secrets.token_hex(32)
        cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (session_token, user_id))

        cur.execute("SELECT id, name, email, avatar_url, hobbies, photos, rating FROM users WHERE id = %s", (user_id,))
        u = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return _cors({
            'token': session_token,
            'user': {
                'id': u[0], 'name': u[1], 'email': u[2], 'avatar': u[3] or '',
                'hobbies': u[4] or [], 'photos': u[5] or [], 'rating': float(u[6]),
            },
        })

    return _cors({'error': 'unknown_action'}, 400)

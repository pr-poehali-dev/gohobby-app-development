import base64
import json
import mimetypes
import os
import uuid

import boto3
import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}


def resp(body, status=200):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'isBase64Encoded': False, 'body': json.dumps(body)}


def get_user(token):
    if not token:
        return None
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    """Загрузка фото активности в S3. Принимает base64-строку, возвращает CDN-URL."""
    if event.get('httpMethod') == 'OPTIONS':
        return resp({})

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    user_id = get_user(token)
    if not user_id:
        return resp({'error': 'unauthorized'}, 401)

    body = json.loads(event.get('body') or '{}')
    data_url = body.get('dataUrl', '')

    if ',' not in data_url:
        return resp({'error': 'invalid_data'}, 400)

    header, b64 = data_url.split(',', 1)
    mime = header.split(';')[0].replace('data:', '') or 'image/jpeg'
    ext = mimetypes.guess_extension(mime) or '.jpg'
    if ext == '.jpe':
        ext = '.jpg'

    file_bytes = base64.b64decode(b64)
    if len(file_bytes) > 5 * 1024 * 1024:
        return resp({'error': 'too_large', 'message': 'Максимум 5 МБ'}, 400)

    key = f"activities/{uuid.uuid4().hex}{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=mime)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return resp({'url': cdn_url})

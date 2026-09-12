#!/bin/sh
set -e

# 等待 PostgreSQL 就绪（depends_on healthcheck 兜底，这里再确认一次）
python - <<'PY'
import os, time, psycopg

while True:
    try:
        psycopg.connect(
            host=os.environ.get("DB_HOST", "db"),
            dbname=os.environ.get("DB_NAME", "usedcar"),
            user=os.environ.get("DB_USER", "usedcar"),
            password=os.environ.get("DB_PASSWORD", "usedcar"),
            connect_timeout=3,
        ).close()
        break
    except Exception:
        print("waiting for postgres...")
        time.sleep(2)
PY

python manage.py migrate --noinput
python manage.py seed_items            # 幂等：已存在则跳过
python manage.py collectstatic --noinput || true

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 60

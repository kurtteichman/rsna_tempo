RSNA Tempo <br />
-- Requirements for install/use <br />
---- RabbitMQ <br />
---- Postgres <br />
---- Python 2.10 <br />

Installation <br />
From rsna_tempo directory: <br />
pip install -r requirements.txt --no-index --find-links file:///tmp/packages <br />
cd rsna_tempo <br />
celery -A rsna_tempo worker --loglevel=INFO <br />
python manage.py runserver 127.0.0.1:9000 <br />

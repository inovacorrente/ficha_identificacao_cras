# Dockerfile simples para Django
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Instalar python-dotenv para ler variáveis do .env
RUN pip install python-dotenv

COPY . .

ENV PYTHONUNBUFFERED=1

# Comando padrão: migrar, criar superusuário e rodar servidor
# O .env será carregado automaticamente pelo python-dotenv (se usado no settings.py)
CMD ["sh", "-c", "python manage.py migrate && DJANGO_SETTINGS_MODULE=core.settings python create_superuser.py && python manage.py runserver 0.0.0.0:8000"]

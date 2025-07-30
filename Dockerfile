# Dockerfile para Django com Sistema de Backup
FROM python:3.12-slim

# Instalar dependências do sistema incluindo cron e sqlite3
RUN apt-get update && apt-get install -y \
    gcc \
    cron \
    sqlite3 \
    tar \
    gzip \
    logrotate \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar e instalar dependências Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Configurar variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Criar diretórios necessários
RUN mkdir -p /app/media /app/static /app/logs /app/backups

# Configurar permissões dos scripts
RUN chmod +x /app/scripts/*.sh

# Configurar cron para backups usando script Docker
RUN echo "0 2 * * * /app/scripts/backup-docker.sh >> /app/logs/backup.log 2>&1" | crontab -

# Expor porta
EXPOSE 8000

# Script de inicialização
CMD ["/app/scripts/docker-entrypoint.sh"]

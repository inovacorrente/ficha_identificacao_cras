#!/bin/bash
# Script de inicialização do container Docker
# Inicia Django e sistema de backup

echo "=== Iniciando Sistema CRAS com Backup ==="
echo "Data: $(date)"

# Aguardar um pouco para garantir que o sistema está pronto
sleep 2

# Executar migrações do Django
echo "🔄 Executando migrações..."
python manage.py migrate

# Criar superusuário se necessário
echo "👤 Configurando superusuário..."
python create_superuser.py

# Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput --clear

# Iniciar serviço do cron
echo "⏰ Iniciando serviço de backup (cron)..."
service cron start

# Verificar se o cron foi configurado
echo "📋 Verificando configuração do cron..."
crontab -l

# Aguardar mais um pouco
sleep 1

# Verificar estrutura de diretórios
echo "📂 Verificando diretórios..."
ls -la /app/backups/ /app/logs/ /app/scripts/

# Iniciar servidor Django
echo "🚀 Iniciando servidor Django..."
exec python manage.py runserver 0.0.0.0:8000

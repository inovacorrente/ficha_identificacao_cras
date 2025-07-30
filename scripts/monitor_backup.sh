#!/bin/bash
# Script de Monitoramento de Backup

PROJECT_DIR="/home/labmaker/Documentos/projetosPrefeitura/ficha_identificacao_cras"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/backup.log"

echo "=== Status do Sistema de Backup ==="
echo "Data: $(date)"
echo ""

# Verificar se o cron está ativo
if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
    echo "✅ Serviço Cron: Ativo"
else
    echo "❌ Serviço Cron: Inativo"
fi

# Verificar entrada no crontab
if crontab -l 2>/dev/null | grep -q backup; then
    echo "✅ Crontab: Configurado"
    echo "   $(crontab -l 2>/dev/null | grep backup)"
else
    echo "❌ Crontab: Não configurado"
fi

# Último backup
LAST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
if [ -n "$LAST_BACKUP" ]; then
    BACKUP_DATE=$(stat -c %y "$LAST_BACKUP" | cut -d' ' -f1-2)
    BACKUP_SIZE=$(du -h "$LAST_BACKUP" | cut -f1)
    echo "✅ Último Backup: $(basename "$LAST_BACKUP")"
    echo "   Data: $BACKUP_DATE"
    echo "   Tamanho: $BACKUP_SIZE"
else
    echo "❌ Nenhum backup encontrado"
fi

# Espaço em disco
DISK_USAGE=$(df "$PROJECT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h "$PROJECT_DIR" | tail -1 | awk '{print $4}')
echo "💽 Espaço em Disco: $DISK_USAGE% usado, $DISK_AVAILABLE disponível"

# Total de backups
BACKUP_COUNT=$(ls "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
echo "📁 Total de Backups: $BACKUP_COUNT"

# Últimas entradas do log
echo ""
echo "📋 Últimas Entradas do Log:"
if [ -f "$LOG_FILE" ]; then
    tail -5 "$LOG_FILE"
else
    echo "   Log não encontrado"
fi

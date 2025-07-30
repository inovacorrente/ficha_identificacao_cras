#!/bin/bash
# Sistema de Backup Automático para Docker - Ficha de Identificação CRAS
# Autor: Sistema CRAS Docker
# Data: $(date)

# Configurações para Docker
PROJECT_DIR="/app"
BACKUP_DIR="$PROJECT_DIR/backups"
DB_PATH="$PROJECT_DIR/db.sqlite3"
LOGS_DIR="$PROJECT_DIR/logs"
MEDIA_DIR="$PROJECT_DIR/media"
LAUDOS_DIR="$PROJECT_DIR/laudos"

# Data atual para nomear os backups
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_$DATE"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Função para log
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$PROJECT_DIR/logs/backup.log"
}

log_message "=== Iniciando Backup Automático Docker - Sistema CRAS ==="
log_message "Container: $(hostname)"
log_message "Backup: $BACKUP_NAME"

# 1. Backup do Banco de Dados SQLite
log_message "📄 Fazendo backup do banco de dados..."
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME/db_$DATE.sqlite3"
    log_message "✅ Banco de dados copiado com sucesso"
    
    # Verificar integridade do banco
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "$DB_PATH" "PRAGMA integrity_check;" > "$BACKUP_DIR/$BACKUP_NAME/db_integrity_$DATE.log"
        log_message "✅ Verificação de integridade concluída"
    else
        log_message "⚠️  sqlite3 não encontrado, pulando verificação de integridade"
    fi
else
    log_message "⚠️  Banco de dados não encontrado: $DB_PATH"
fi

# 2. Backup dos Logs
log_message "📋 Fazendo backup dos logs..."
if [ -d "$LOGS_DIR" ]; then
    cp -r "$LOGS_DIR" "$BACKUP_DIR/$BACKUP_NAME/logs_$DATE"
    log_message "✅ Logs copiados com sucesso"
    
    # Compactar logs antigos (mais de 30 dias)
    find "$LOGS_DIR" -name "*.log" -type f -mtime +30 -exec gzip {} \; 2>/dev/null
    log_message "✅ Logs antigos compactados"
else
    log_message "⚠️  Diretório de logs não encontrado: $LOGS_DIR"
fi

# 3. Backup dos Arquivos de Media (PDFs, uploads)
log_message "📁 Fazendo backup dos arquivos de media..."
if [ -d "$MEDIA_DIR" ]; then
    cp -r "$MEDIA_DIR" "$BACKUP_DIR/$BACKUP_NAME/media_$DATE"
    log_message "✅ Arquivos de media copiados com sucesso"
else
    log_message "⚠️  Diretório de media não encontrado: $MEDIA_DIR"
fi

# 4. Backup dos Laudos (se existir)
if [ -d "$LAUDOS_DIR" ]; then
    cp -r "$LAUDOS_DIR" "$BACKUP_DIR/$BACKUP_NAME/laudos_$DATE"
    log_message "✅ Laudos copiados com sucesso"
fi

# 5. Backup das Configurações
log_message "⚙️  Fazendo backup das configurações..."
cp "$PROJECT_DIR/core/settings.py" "$BACKUP_DIR/$BACKUP_NAME/settings_$DATE.py" 2>/dev/null
cp "$PROJECT_DIR/requirements.txt" "$BACKUP_DIR/$BACKUP_NAME/requirements_$DATE.txt" 2>/dev/null
cp "$PROJECT_DIR/manage.py" "$BACKUP_DIR/$BACKUP_NAME/manage_$DATE.py" 2>/dev/null

# 6. Informações do container Docker
cat > "$BACKUP_DIR/$BACKUP_NAME/docker_info.txt" << EOF
=== INFORMAÇÕES DO CONTAINER DOCKER ===
Data de Criação: $(date)
Sistema: Ficha de Identificação CRAS (Docker)
Container ID: $(hostname)
Imagem: $(cat /proc/self/cgroup | head -1 | cut -d/ -f3 2>/dev/null || echo "N/A")
Python Version: $(python3 --version 2>/dev/null || echo "Python não encontrado")
Django Version: $(cd "$PROJECT_DIR" && python3 -c "import django; print(django.get_version())" 2>/dev/null || echo "Django não encontrado")

=== VOLUMES E MONTAGENS ===
$(mount | grep "/app" || echo "Nenhuma montagem específica encontrada")

=== REDE ===
$(ip addr show || echo "Informação de rede não disponível")

=== PROCESSOS ===
$(ps aux || echo "Lista de processos não disponível")
EOF

# 7. Criar arquivo de informações do backup
cat > "$BACKUP_DIR/$BACKUP_NAME/backup_info.txt" << EOF
=== INFORMAÇÕES DO BACKUP (DOCKER) ===
Data de Criação: $(date)
Sistema: Ficha de Identificação CRAS
Ambiente: Docker Container
Container: $(hostname)
Versão Python: $(python3 --version 2>/dev/null || echo "Python não encontrado")
Versão Django: $(cd "$PROJECT_DIR" && python3 -c "import django; print(django.get_version())" 2>/dev/null || echo "Django não encontrado")

=== CONTEÚDO DO BACKUP ===
- Banco de dados SQLite
- Logs de segurança e aplicação
- Arquivos de media (PDFs, uploads)
- Laudos médicos
- Configurações do sistema
- Informações do container
- Verificação de integridade

=== TAMANHOS ===
Banco de dados: $(du -h "$DB_PATH" 2>/dev/null | cut -f1 || echo "N/A")
Logs: $(du -sh "$LOGS_DIR" 2>/dev/null | cut -f1 || echo "N/A")
Media: $(du -sh "$MEDIA_DIR" 2>/dev/null | cut -f1 || echo "N/A")
Laudos: $(du -sh "$LAUDOS_DIR" 2>/dev/null | cut -f1 || echo "N/A")
Backup total: $(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)

=== STATUS DO CONTAINER ===
Espaço em disco disponível: $(df -h "$PROJECT_DIR" | tail -1 | awk '{print $4}')
Memória disponível: $(free -h | grep "Mem:" | awk '{print $7}' 2>/dev/null || echo "N/A")
Uptime: $(uptime | cut -d',' -f1 | cut -d' ' -f4- || echo "N/A")
EOF

# 8. Compactar o backup
log_message "🗜️  Compactando backup..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME" 2>/dev/null
if [ $? -eq 0 ]; then
    rm -rf "$BACKUP_NAME"
    log_message "✅ Backup compactado: ${BACKUP_NAME}.tar.gz"
    log_message "📊 Tamanho do backup: $(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)"
else
    log_message "❌ Erro ao compactar backup"
    exit 1
fi

# 9. Limpeza de backups antigos (manter apenas os últimos 10 no Docker)
log_message "🧹 Limpando backups antigos..."
ls -t backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
REMAINING_BACKUPS=$(ls backup_*.tar.gz 2>/dev/null | wc -l)
log_message "✅ Limpeza concluída (mantidos $REMAINING_BACKUPS backups)"

# 10. Verificar espaço em disco
DISK_USAGE=$(df "$PROJECT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    log_message "⚠️  ATENÇÃO: Uso de disco alto ($DISK_USAGE%)"
fi

# 11. Notificação Docker (logs do container)
log_message "🐳 Backup Docker concluído com sucesso!"
log_message "📁 Local: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
log_message "🏠 Container: $(hostname)"

# Para logs do Docker
echo "DOCKER_BACKUP_SUCCESS: ${BACKUP_NAME}.tar.gz created at $(date)" >&2

log_message "=================================================="

exit 0

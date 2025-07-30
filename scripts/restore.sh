#!/bin/bash
# Script de Restauração - Sistema CRAS
# Autor: Sistema CRAS

# Configurações
PROJECT_DIR="/home/labmaker/Documentos/projetosPrefeitura/ficha_identificacao_cras"
BACKUP_DIR="$PROJECT_DIR/backups"

# Função para log
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar se foi passado um arquivo de backup
if [ $# -eq 0 ]; then
    echo "=== Backups Disponíveis ==="
    if ls "$BACKUP_DIR"/*.tar.gz 1> /dev/null 2>&1; then
        for backup in "$BACKUP_DIR"/backup_*.tar.gz; do
            backup_name=$(basename "$backup")
            backup_date=$(echo "$backup_name" | sed 's/backup_\([0-9]\{8\}\)_\([0-9]\{6\}\).tar.gz/\1 \2/' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\) \([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\3\/\2\/\1 \4:\5:\6/')
            backup_size=$(du -h "$backup" | cut -f1)
            echo "📁 $backup_name ($backup_size) - $backup_date"
        done
    else
        echo "❌ Nenhum backup encontrado em $BACKUP_DIR"
    fi
    echo ""
    echo "Uso: $0 <nome_do_backup.tar.gz>"
    echo "Exemplo: $0 backup_20250730_120000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Verificar se o arquivo de backup existe
if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ Arquivo de backup não encontrado: $BACKUP_PATH"
    echo ""
    echo "Backups disponíveis:"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

log_message "=== Iniciando Restauração do Sistema CRAS ==="
log_message "Backup: $BACKUP_FILE"
log_message "Tamanho: $(du -h "$BACKUP_PATH" | cut -f1)"

# Verificar integridade do arquivo
log_message "🔍 Verificando integridade do backup..."
if ! tar -tzf "$BACKUP_PATH" >/dev/null 2>&1; then
    log_message "❌ Arquivo de backup corrompido ou inválido"
    exit 1
fi
log_message "✅ Arquivo de backup íntegro"

# Mostrar informações do backup
TEMP_INFO_DIR="/tmp/backup_info_$$"
mkdir -p "$TEMP_INFO_DIR"
tar -xzf "$BACKUP_PATH" -C "$TEMP_INFO_DIR" --wildcards "*/backup_info.txt" 2>/dev/null

if [ -f "$TEMP_INFO_DIR"/*/backup_info.txt ]; then
    echo ""
    echo "=== Informações do Backup ==="
    cat "$TEMP_INFO_DIR"/*/backup_info.txt | head -20
    echo "=========================="
fi
rm -rf "$TEMP_INFO_DIR"

# Confirmar a restauração
echo ""
echo "⚠️  ATENÇÃO: Esta operação irá:"
echo "   - Sobrescrever o banco de dados atual"
echo "   - Substituir os logs existentes"
echo "   - Substituir os arquivos de media"
echo "   - Criar um backup de segurança dos dados atuais"
echo ""
read -p "Deseja continuar com a restauração? (digite 'CONFIRMO' para prosseguir): " confirmacao

if [ "$confirmacao" != "CONFIRMO" ]; then
    log_message "❌ Restauração cancelada pelo usuário"
    exit 1
fi

# Parar servidor Django se estiver rodando
log_message "🛑 Verificando se o servidor Django está rodando..."
DJANGO_PID=$(pgrep -f "runserver")
if [ -n "$DJANGO_PID" ]; then
    log_message "⚠️  Servidor Django detectado (PID: $DJANGO_PID). Interrompendo..."
    kill "$DJANGO_PID" 2>/dev/null
    sleep 2
    log_message "✅ Servidor Django interrompido"
fi

# Criar backup de segurança dos dados atuais
SAFETY_BACKUP="safety_backup_$(date +"%Y%m%d_%H%M%S")"
SAFETY_DIR="$BACKUP_DIR/$SAFETY_BACKUP"
log_message "💾 Criando backup de segurança: $SAFETY_BACKUP"

mkdir -p "$SAFETY_DIR"

# Backup dos dados atuais
[ -f "$PROJECT_DIR/db.sqlite3" ] && cp "$PROJECT_DIR/db.sqlite3" "$SAFETY_DIR/" && log_message "   ✅ Banco atual salvo"
[ -d "$PROJECT_DIR/logs" ] && cp -r "$PROJECT_DIR/logs" "$SAFETY_DIR/" && log_message "   ✅ Logs atuais salvos"
[ -d "$PROJECT_DIR/media" ] && cp -r "$PROJECT_DIR/media" "$SAFETY_DIR/" && log_message "   ✅ Media atual salva"
[ -d "$PROJECT_DIR/laudos" ] && cp -r "$PROJECT_DIR/laudos" "$SAFETY_DIR/" && log_message "   ✅ Laudos atuais salvos"

# Compactar backup de segurança
cd "$BACKUP_DIR"
tar -czf "${SAFETY_BACKUP}.tar.gz" "$SAFETY_BACKUP" 2>/dev/null && rm -rf "$SAFETY_BACKUP"
log_message "✅ Backup de segurança criado: ${SAFETY_BACKUP}.tar.gz"

# Extrair o backup
log_message "📦 Extraindo backup para restauração..."
EXTRACT_DIR="/tmp/restore_$$"
mkdir -p "$EXTRACT_DIR"
tar -xzf "$BACKUP_PATH" -C "$EXTRACT_DIR"

BACKUP_CONTENT_DIR=$(find "$EXTRACT_DIR" -maxdepth 1 -type d -name "backup_*" | head -1)
if [ ! -d "$BACKUP_CONTENT_DIR" ]; then
    log_message "❌ Erro ao extrair o backup"
    rm -rf "$EXTRACT_DIR"
    exit 1
fi

log_message "✅ Backup extraído com sucesso"

# Restaurar banco de dados
log_message "📄 Restaurando banco de dados..."
DB_BACKUP=$(find "$BACKUP_CONTENT_DIR" -name "db_*.sqlite3" | head -1)
if [ -f "$DB_BACKUP" ]; then
    cp "$DB_BACKUP" "$PROJECT_DIR/db.sqlite3"
    log_message "✅ Banco de dados restaurado"
    
    # Verificar integridade do banco restaurado
    if command -v sqlite3 >/dev/null 2>&1; then
        INTEGRITY_CHECK=$(sqlite3 "$PROJECT_DIR/db.sqlite3" "PRAGMA integrity_check;" 2>/dev/null)
        if [ "$INTEGRITY_CHECK" = "ok" ]; then
            log_message "✅ Integridade do banco verificada"
        else
            log_message "⚠️  Possível problema na integridade do banco: $INTEGRITY_CHECK"
        fi
    fi
else
    log_message "⚠️  Arquivo de banco de dados não encontrado no backup"
fi

# Restaurar logs
log_message "📋 Restaurando logs..."
LOGS_BACKUP=$(find "$BACKUP_CONTENT_DIR" -name "logs_*" -type d | head -1)
if [ -d "$LOGS_BACKUP" ]; then
    rm -rf "$PROJECT_DIR/logs"
    cp -r "$LOGS_BACKUP" "$PROJECT_DIR/logs"
    log_message "✅ Logs restaurados"
else
    log_message "⚠️  Diretório de logs não encontrado no backup"
    mkdir -p "$PROJECT_DIR/logs"
fi

# Restaurar media
log_message "📁 Restaurando arquivos de media..."
MEDIA_BACKUP=$(find "$BACKUP_CONTENT_DIR" -name "media_*" -type d | head -1)
if [ -d "$MEDIA_BACKUP" ]; then
    rm -rf "$PROJECT_DIR/media"
    cp -r "$MEDIA_BACKUP" "$PROJECT_DIR/media"
    log_message "✅ Arquivos de media restaurados"
else
    log_message "⚠️  Diretório de media não encontrado no backup"
    mkdir -p "$PROJECT_DIR/media"
fi

# Restaurar laudos
LAUDOS_BACKUP=$(find "$BACKUP_CONTENT_DIR" -name "laudos_*" -type d | head -1)
if [ -d "$LAUDOS_BACKUP" ]; then
    rm -rf "$PROJECT_DIR/laudos"
    cp -r "$LAUDOS_BACKUP" "$PROJECT_DIR/laudos"
    log_message "✅ Laudos restaurados"
fi

# Ajustar permissões
log_message "🔐 Ajustando permissões..."
chown -R $(whoami):$(whoami) "$PROJECT_DIR/db.sqlite3" 2>/dev/null
chown -R $(whoami):$(whoami) "$PROJECT_DIR/logs" 2>/dev/null
chown -R $(whoami):$(whoami) "$PROJECT_DIR/media" 2>/dev/null
chown -R $(whoami):$(whoami) "$PROJECT_DIR/laudos" 2>/dev/null
log_message "✅ Permissões ajustadas"

# Limpeza
rm -rf "$EXTRACT_DIR"

# Testar Django
log_message "🧪 Testando configuração Django..."
cd "$PROJECT_DIR"
if python3 manage.py check --deploy 2>/dev/null >/dev/null; then
    log_message "✅ Configuração Django válida"
else
    log_message "⚠️  Possíveis problemas na configuração Django"
fi

# Logs de auditoria
echo "=== AUDITORIA DE RESTAURAÇÃO ===" >> "$PROJECT_DIR/logs/restore.log"
echo "Data: $(date)" >> "$PROJECT_DIR/logs/restore.log"
echo "Usuário: $(whoami)" >> "$PROJECT_DIR/logs/restore.log"
echo "Backup Restaurado: $BACKUP_FILE" >> "$PROJECT_DIR/logs/restore.log"
echo "Backup de Segurança: ${SAFETY_BACKUP}.tar.gz" >> "$PROJECT_DIR/logs/restore.log"
echo "Status: Sucesso" >> "$PROJECT_DIR/logs/restore.log"
echo "===============================" >> "$PROJECT_DIR/logs/restore.log"

log_message "================================================"
log_message "🎉 Restauração concluída com sucesso!"
log_message "💾 Backup de segurança: $BACKUP_DIR/${SAFETY_BACKUP}.tar.gz"
log_message "📋 Log de auditoria: $PROJECT_DIR/logs/restore.log"
log_message ""
log_message "⚠️  PRÓXIMOS PASSOS:"
log_message "   1. Reiniciar o servidor Django: cd $PROJECT_DIR && python3 manage.py runserver"
log_message "   2. Verificar funcionamento do sistema"
log_message "   3. Executar backup após confirmação: $PROJECT_DIR/scripts/backup.sh"
log_message "================================================"

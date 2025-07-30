#!/bin/bash
# Script de Configuração do Cron para Backup Automático
# Sistema: Ficha de Identificação CRAS

echo "=== Configurando Backup Automático com Cron ==="
echo "Sistema: Ficha de Identificação CRAS"
echo "Data: $(date)"
echo "=============================================="

# Definir caminhos
PROJECT_DIR="/home/labmaker/Documentos/projetosPrefeitura/ficha_identificacao_cras"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup.sh"
LOG_FILE="$PROJECT_DIR/logs/backup.log"

# Verificar se o script de backup existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Script de backup não encontrado: $BACKUP_SCRIPT"
    exit 1
fi

# Tornar os scripts executáveis
echo "🔧 Configurando permissões..."
chmod +x "$PROJECT_DIR/scripts/backup.sh"
chmod +x "$PROJECT_DIR/scripts/setup_cron.sh"
echo "✅ Permissões configuradas"

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Verificar se o cron está instalado
if ! command -v crontab >/dev/null 2>&1; then
    echo "❌ Cron não está instalado. Instalando..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y cron
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y cronie
    else
        echo "❌ Não foi possível instalar o cron automaticamente"
        echo "   Por favor, instale manualmente: sudo apt-get install cron"
        exit 1
    fi
fi

# Verificar se o cron está rodando
if ! systemctl is-active --quiet cron 2>/dev/null && ! systemctl is-active --quiet crond 2>/dev/null; then
    echo "🔄 Iniciando serviço do cron..."
    sudo systemctl enable cron 2>/dev/null || sudo systemctl enable crond 2>/dev/null
    sudo systemctl start cron 2>/dev/null || sudo systemctl start crond 2>/dev/null
fi

# Verificar se a entrada já existe no crontab
CRON_ENTRY="0 2 * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1"
CRON_COMMENT="# Backup automático do Sistema CRAS - Diário às 2:00 AM"

if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "ℹ️  Entrada do cron já existe. Atualizando..."
    # Remove entrada antiga e adiciona nova
    (crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "$CRON_COMMENT"; echo "$CRON_ENTRY") | crontab -
else
    echo "➕ Adicionando nova entrada ao crontab..."
    # Adiciona nova entrada
    (crontab -l 2>/dev/null; echo ""; echo "$CRON_COMMENT"; echo "$CRON_ENTRY") | crontab -
fi

echo "✅ Backup automático configurado!"

# Mostrar configuração atual
echo ""
echo "=== Configuração do Cron ==="
echo "📅 Frequência: Diário às 2:00 AM"
echo "📁 Script: $BACKUP_SCRIPT"
echo "📋 Log: $LOG_FILE"
echo "⏰ Próxima execução: $(date -d 'tomorrow 02:00' '+%d/%m/%Y às %H:%M')"

# Opções adicionais de agendamento
echo ""
echo "=== Opções de Agendamento Disponíveis ==="
echo "1. Diário às 2:00 AM (atual): 0 2 * * *"
echo "2. A cada 6 horas: 0 */6 * * *"
echo "3. Semanal (domingo 3:00 AM): 0 3 * * 0"
echo "4. A cada 12 horas: 0 */12 * * *"

read -p "Deseja alterar o agendamento? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Escolha uma opção (1-4):"
    read -p "Opção: " opcao
    
    case $opcao in
        1)
            NEW_CRON="0 2 * * *"
            DESCRICAO="Diário às 2:00 AM"
            ;;
        2)
            NEW_CRON="0 */6 * * *"
            DESCRICAO="A cada 6 horas"
            ;;
        3)
            NEW_CRON="0 3 * * 0"
            DESCRICAO="Semanal (domingo às 3:00 AM)"
            ;;
        4)
            NEW_CRON="0 */12 * * *"
            DESCRICAO="A cada 12 horas"
            ;;
        *)
            echo "Opção inválida. Mantendo configuração atual."
            NEW_CRON="0 2 * * *"
            DESCRICAO="Diário às 2:00 AM"
            ;;
    esac
    
    # Atualizar crontab com novo agendamento
    NEW_CRON_ENTRY="$NEW_CRON $BACKUP_SCRIPT >> $LOG_FILE 2>&1"
    NEW_CRON_COMMENT="# Backup automático do Sistema CRAS - $DESCRICAO"
    
    (crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "$NEW_CRON_COMMENT"; echo "$NEW_CRON_ENTRY") | crontab -
    echo "✅ Agendamento atualizado para: $DESCRICAO"
fi

# Mostrar crontab atual
echo ""
echo "=== Crontab Atual ==="
crontab -l 2>/dev/null | grep -A1 -B1 "CRAS\|backup" || echo "Nenhuma entrada relacionada ao backup encontrada"

# Testar o script de backup
echo ""
read -p "Deseja executar um teste do backup agora? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🧪 Executando teste do backup..."
    "$BACKUP_SCRIPT"
    if [ $? -eq 0 ]; then
        echo "✅ Teste do backup executado com sucesso!"
    else
        echo "❌ Erro no teste do backup. Verifique o log: $LOG_FILE"
    fi
fi

# Informações sobre monitoramento
echo ""
echo "=== Monitoramento e Manutenção ==="
echo "📋 Ver logs: tail -f $LOG_FILE"
echo "📊 Listar backups: ls -la $PROJECT_DIR/backups/"
echo "🔍 Verificar cron: crontab -l | grep backup"
echo "⚙️  Editar cron: crontab -e"
echo "🗑️  Remover entrada: crontab -l | grep -v backup | crontab -"

# Criar script de monitoramento
MONITOR_SCRIPT="$PROJECT_DIR/scripts/monitor_backup.sh"
cat > "$MONITOR_SCRIPT" << 'EOF'
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
EOF

chmod +x "$MONITOR_SCRIPT"
echo "✅ Script de monitoramento criado: $MONITOR_SCRIPT"

echo ""
echo "=============================================="
echo "🎉 Configuração do Cron Concluída!"
echo ""
echo "📋 Comandos Úteis:"
echo "   Monitorar: $PROJECT_DIR/scripts/monitor_backup.sh"
echo "   Ver logs: tail -f $LOG_FILE"
echo "   Backup manual: $BACKUP_SCRIPT"
echo "=============================================="

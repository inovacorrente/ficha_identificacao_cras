#!/bin/bash
# Script de Gerenciamento de Backup Docker
# Sistema: Ficha de Identificação CRAS

set -e

COMPOSE_FILE="docker-compose.yml"
SERVICE_NAME="web"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para print colorido
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_color $RED "❌ Docker não está rodando. Inicie o Docker primeiro."
        exit 1
    fi
}

# Função para verificar se o serviço está rodando
check_service() {
    if ! docker-compose ps | grep -q "$SERVICE_NAME.*Up"; then
        print_color $YELLOW "⚠️  Serviço $SERVICE_NAME não está rodando."
        return 1
    fi
    return 0
}

# Executar backup manual
backup_now() {
    print_color $BLUE "🔄 Executando backup manual..."
    check_docker
    
    if check_service; then
        docker-compose exec $SERVICE_NAME /app/scripts/backup-docker.sh
        print_color $GREEN "✅ Backup executado com sucesso!"
    else
        print_color $RED "❌ Não é possível executar backup. Serviço não está rodando."
        exit 1
    fi
}

# Listar backups
list_backups() {
    print_color $BLUE "📁 Listando backups disponíveis..."
    check_docker
    
    if [ -d "./backups" ]; then
        ls -la ./backups/*.tar.gz 2>/dev/null || print_color $YELLOW "⚠️  Nenhum backup encontrado"
    else
        print_color $YELLOW "⚠️  Diretório de backups não encontrado"
    fi
}

# Ver logs de backup
view_logs() {
    print_color $BLUE "📋 Visualizando logs de backup..."
    check_docker
    
    if [ -f "./logs/backup.log" ]; then
        tail -f ./logs/backup.log
    else
        print_color $YELLOW "⚠️  Log de backup não encontrado"
    fi
}

# Monitorar status do container
monitor_status() {
    print_color $BLUE "📊 Status do sistema..."
    check_docker
    
    echo "=== Status dos Containers ==="
    docker-compose ps
    
    echo ""
    echo "=== Último Backup ==="
    if [ -d "./backups" ]; then
        LAST_BACKUP=$(ls -t ./backups/backup_*.tar.gz 2>/dev/null | head -1)
        if [ -n "$LAST_BACKUP" ]; then
            BACKUP_DATE=$(stat -c %y "$LAST_BACKUP" | cut -d' ' -f1-2)
            BACKUP_SIZE=$(du -h "$LAST_BACKUP" | cut -f1)
            print_color $GREEN "✅ $(basename "$LAST_BACKUP") - $BACKUP_SIZE - $BACKUP_DATE"
        else
            print_color $YELLOW "⚠️  Nenhum backup encontrado"
        fi
    fi
    
    echo ""
    echo "=== Espaço em Disco ==="
    df -h . | tail -1
    
    echo ""
    echo "=== Cron Status (no container) ==="
    if check_service; then
        docker-compose exec $SERVICE_NAME crontab -l | grep backup || print_color $YELLOW "⚠️  Cron não configurado no container"
        echo ""
        print_color $BLUE "📋 Verificando logs de backup no container..."
        docker-compose exec $SERVICE_NAME tail -5 /app/logs/backup.log 2>/dev/null || print_color $YELLOW "⚠️  Log de backup não encontrado"
    fi
}

# Restaurar backup
restore_backup() {
    if [ -z "$1" ]; then
        print_color $RED "❌ Especifique o arquivo de backup"
        print_color $YELLOW "Uso: $0 restore <backup_file.tar.gz>"
        list_backups
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "./backups/$BACKUP_FILE" ]; then
        print_color $RED "❌ Arquivo de backup não encontrado: ./backups/$BACKUP_FILE"
        exit 1
    fi
    
    print_color $YELLOW "⚠️  ATENÇÃO: Esta operação irá:"
    echo "   - Parar o container"
    echo "   - Restaurar o banco de dados"
    echo "   - Restaurar arquivos de media"
    echo "   - Reiniciar o container"
    echo ""
    read -p "Confirma a restauração? (digite 'CONFIRMO'): " confirmacao
    
    if [ "$confirmacao" != "CONFIRMO" ]; then
        print_color $YELLOW "❌ Restauração cancelada"
        exit 1
    fi
    
    print_color $BLUE "🔄 Iniciando restauração..."
    
    # Parar container
    print_color $BLUE "🛑 Parando container..."
    docker-compose stop $SERVICE_NAME
    
    # Extrair backup
    print_color $BLUE "📦 Extraindo backup..."
    cd backups
    tar -xzf "$BACKUP_FILE"
    BACKUP_DIR=$(basename "$BACKUP_FILE" .tar.gz)
    
    # Restaurar banco
    if [ -f "$BACKUP_DIR/db_"*".sqlite3" ]; then
        cp "$BACKUP_DIR/db_"*".sqlite3" ../db.sqlite3
        print_color $GREEN "✅ Banco de dados restaurado"
    fi
    
    # Restaurar media
    if [ -d "$BACKUP_DIR/media_"* ]; then
        rm -rf ../media/*
        cp -r "$BACKUP_DIR/media_"*/* ../media/
        print_color $GREEN "✅ Arquivos de media restaurados"
    fi
    
    # Restaurar laudos
    if [ -d "$BACKUP_DIR/laudos_"* ]; then
        rm -rf ../laudos/*
        cp -r "$BACKUP_DIR/laudos_"*/* ../laudos/
        print_color $GREEN "✅ Laudos restaurados"
    fi
    
    # Limpeza
    rm -rf "$BACKUP_DIR"
    cd ..
    
    # Reiniciar container
    print_color $BLUE "🚀 Reiniciando container..."
    docker-compose start $SERVICE_NAME
    
    # Aguardar container iniciar
    sleep 10
    
    print_color $GREEN "🎉 Restauração concluída!"
    print_color $BLUE "🔍 Verificando status..."
    docker-compose ps
}

# Menu de opções
show_menu() {
    echo "=== Gerenciador de Backup Docker - CRAS ==="
    echo "1. Executar backup agora"
    echo "2. Listar backups"
    echo "3. Ver logs de backup"
    echo "4. Monitorar status"
    echo "5. Restaurar backup"
    echo "6. Iniciar sistema com monitoramento"
    echo "7. Parar sistema"
    echo "8. Sair"
    echo ""
}

# Iniciar sistema com monitoramento
start_with_monitoring() {
    print_color $BLUE "🚀 Iniciando sistema com monitoramento..."
    docker-compose --profile monitoring up -d
    print_color $GREEN "✅ Sistema iniciado!"
    print_color $BLUE "📋 Para ver logs de backup: docker-compose logs -f backup-monitor"
}

# Parar sistema
stop_system() {
    print_color $BLUE "🛑 Parando sistema..."
    docker-compose down
    print_color $GREEN "✅ Sistema parado!"
}

# Main
case "$1" in
    backup)
        backup_now
        ;;
    list)
        list_backups
        ;;
    logs)
        view_logs
        ;;
    status)
        monitor_status
        ;;
    restore)
        restore_backup "$2"
        ;;
    start)
        start_with_monitoring
        ;;
    stop)
        stop_system
        ;;
    menu|"")
        while true; do
            show_menu
            read -p "Escolha uma opção (1-8): " choice
            case $choice in
                1) backup_now ;;
                2) list_backups ;;
                3) view_logs ;;
                4) monitor_status ;;
                5) 
                    list_backups
                    echo ""
                    read -p "Digite o nome do backup: " backup_file
                    restore_backup "$backup_file"
                    ;;
                6) start_with_monitoring ;;
                7) stop_system ;;
                8) print_color $GREEN "👋 Até logo!"; exit 0 ;;
                *) print_color $RED "❌ Opção inválida" ;;
            esac
            echo ""
            read -p "Pressione Enter para continuar..."
            clear
        done
        ;;
    *)
        echo "Uso: $0 {backup|list|logs|status|restore|start|stop|menu}"
        echo ""
        echo "Comandos:"
        echo "  backup          - Executar backup manual"
        echo "  list            - Listar backups disponíveis"
        echo "  logs            - Ver logs de backup em tempo real"
        echo "  status          - Monitorar status do sistema"
        echo "  restore <file>  - Restaurar backup específico"
        echo "  start           - Iniciar sistema com monitoramento"
        echo "  stop            - Parar sistema"
        echo "  menu            - Mostrar menu interativo"
        exit 1
        ;;
esac

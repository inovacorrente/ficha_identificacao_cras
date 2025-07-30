#!/bin/bash
# Script de Configuração Docker - Sistema CRAS com Backup
# Automatiza todo o processo de configuração e inicialização

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_color $BLUE "========================================="
    print_color $BLUE "$1"
    print_color $BLUE "========================================="
}

# Verificar se Docker está instalado e rodando
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        print_color $RED "❌ Docker não está instalado"
        print_color $YELLOW "   Instale o Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_color $RED "❌ Docker não está rodando"
        print_color $YELLOW "   Inicie o Docker e tente novamente"
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_color $RED "❌ Docker Compose não está instalado"
        print_color $YELLOW "   Instale o Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_color $GREEN "✅ Docker e Docker Compose estão disponíveis"
}

# Criar arquivos de configuração se necessário
setup_config() {
    print_header "Configurando Arquivos"
    
    # Criar .env se não existir
    if [ ! -f ".env" ]; then
        print_color $BLUE "📝 Criando arquivo .env..."
        cat > .env << EOF
# Configuração Django
DEBUG=False
SECRET_KEY=sua-chave-secreta-aqui-$(openssl rand -hex 32)
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Configuração de Backup
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *

# Configuração do Container
CONTAINER_NAME=cras-web
EOF
        print_color $GREEN "✅ Arquivo .env criado"
    else
        print_color $GREEN "✅ Arquivo .env já existe"
    fi
    
    # Criar diretórios necessários
    print_color $BLUE "📁 Criando diretórios..."
    mkdir -p backups logs media laudos
    print_color $GREEN "✅ Diretórios criados"
    
    # Verificar permissões dos scripts
    print_color $BLUE "🔧 Configurando permissões..."
    chmod +x scripts/*.sh
    print_color $GREEN "✅ Permissões configuradas"
}

# Construir imagem Docker
build_image() {
    print_header "Construindo Imagem Docker"
    
    print_color $BLUE "🔨 Construindo imagem (isso pode demorar alguns minutos)..."
    docker-compose build --no-cache
    print_color $GREEN "✅ Imagem construída com sucesso"
}

# Inicializar sistema
start_system() {
    print_header "Iniciando Sistema"
    
    print_color $BLUE "🚀 Iniciando containers..."
    docker-compose up -d
    
    print_color $BLUE "⏳ Aguardando sistema inicializar..."
    sleep 15
    
    # Verificar se está rodando
    if docker-compose ps | grep -q "Up"; then
        print_color $GREEN "✅ Sistema iniciado com sucesso!"
        
        print_color $BLUE "🔍 Verificando saúde do container..."
        docker-compose ps
        
        print_color $BLUE "📋 Verificando cron no container..."
        docker-compose exec web crontab -l || print_color $YELLOW "⚠️  Verificação do cron falhou"
        
    else
        print_color $RED "❌ Erro ao iniciar sistema"
        print_color $YELLOW "   Verificando logs..."
        docker-compose logs --tail=20
        exit 1
    fi
}

# Testar backup
test_backup() {
    print_header "Testando Sistema de Backup"
    
    print_color $BLUE "🧪 Executando backup de teste..."
    ./scripts/docker-backup.sh backup
    
    print_color $BLUE "📊 Verificando resultado..."
    if ls backups/backup_*.tar.gz >/dev/null 2>&1; then
        LATEST_BACKUP=$(ls -t backups/backup_*.tar.gz | head -1)
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        print_color $GREEN "✅ Backup criado: $(basename "$LATEST_BACKUP") ($BACKUP_SIZE)"
    else
        print_color $RED "❌ Erro no teste de backup"
        exit 1
    fi
}

# Mostrar informações finais
show_final_info() {
    print_header "Sistema Configurado com Sucesso"
    
    print_color $GREEN "🎉 O Sistema CRAS está rodando com backup automático!"
    echo ""
    
    print_color $BLUE "📋 Informações do Sistema:"
    echo "   🌐 Aplicação: http://localhost:8000"
    echo "   📁 Backups: ./backups/"
    echo "   📋 Logs: ./logs/"
    echo "   ⏰ Backup automático: Diário às 2:00 AM"
    echo ""
    
    print_color $BLUE "🛠️  Comandos Úteis:"
    echo "   ./scripts/docker-backup.sh menu    - Menu de gerenciamento"
    echo "   ./scripts/docker-backup.sh backup  - Backup manual"
    echo "   ./scripts/docker-backup.sh status  - Status do sistema"
    echo "   docker-compose logs -f             - Ver logs"
    echo "   docker-compose down                - Parar sistema"
    echo "   docker-compose up -d               - Iniciar sistema"
    echo ""
    
    print_color $YELLOW "⚠️  Lembre-se:"
    echo "   - Configure sua SECRET_KEY no arquivo .env"
    echo "   - Acesse http://localhost:8000 para usar o sistema"
    echo "   - Backups automáticos rodam às 2:00 AM"
    echo ""
}

# Menu de configuração
setup_menu() {
    while true; do
        clear
        print_color $BLUE "=== Configurador Docker - Sistema CRAS ==="
        echo "1. Configuração Completa (Recomendado)"
        echo "2. Apenas construir imagem"
        echo "3. Apenas iniciar sistema"
        echo "4. Testar backup"
        echo "5. Verificar status"
        echo "6. Ver logs"
        echo "7. Parar sistema"
        echo "8. Menu de backup"
        echo "9. Sair"
        echo ""
        
        read -p "Escolha uma opção (1-9): " choice
        
        case $choice in
            1)
                check_docker
                setup_config
                build_image
                start_system
                test_backup
                show_final_info
                break
                ;;
            2)
                check_docker
                build_image
                ;;
            3)
                check_docker
                start_system
                ;;
            4)
                test_backup
                ;;
            5)
                ./scripts/docker-backup.sh status
                ;;
            6)
                docker-compose logs -f
                ;;
            7)
                docker-compose down
                print_color $GREEN "✅ Sistema parado"
                ;;
            8)
                ./scripts/docker-backup.sh menu
                ;;
            9)
                print_color $GREEN "👋 Até logo!"
                exit 0
                ;;
            *)
                print_color $RED "❌ Opção inválida"
                sleep 2
                ;;
        esac
        
        if [ $choice -ne 1 ] && [ $choice -ne 9 ]; then
            echo ""
            read -p "Pressione Enter para continuar..."
        fi
    done
}

# Main
case "$1" in
    full|setup)
        check_docker
        setup_config
        build_image
        start_system
        test_backup
        show_final_info
        ;;
    build)
        check_docker
        build_image
        ;;
    start)
        check_docker
        start_system
        ;;
    test)
        test_backup
        ;;
    info)
        show_final_info
        ;;
    menu|"")
        setup_menu
        ;;
    *)
        echo "Uso: $0 {full|build|start|test|info|menu}"
        echo ""
        echo "Comandos:"
        echo "  full   - Configuração completa (recomendado)"
        echo "  build  - Apenas construir imagem Docker"
        echo "  start  - Apenas iniciar sistema"
        echo "  test   - Testar sistema de backup"
        echo "  info   - Mostrar informações do sistema"
        echo "  menu   - Menu interativo"
        exit 1
        ;;
esac

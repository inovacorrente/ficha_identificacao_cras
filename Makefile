# Makefile para Sistema CRAS com Docker e Backup
.PHONY: help setup build start stop restart logs backup status clean test

# Configuração padrão
COMPOSE_FILE = docker-compose.yml
SERVICE_NAME = web

# Cores para output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
BLUE = \033[0;34m
NC = \033[0m

help: ## Mostrar este menu de ajuda
	@echo "$(BLUE)=== Sistema CRAS - Docker + Backup ===$(NC)"
	@echo ""
	@echo "$(GREEN)Comandos Principais:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)Exemplos:$(NC)"
	@echo "  make setup    # Configuração completa (primeira vez)"
	@echo "  make start    # Iniciar sistema"
	@echo "  make backup   # Backup manual"
	@echo "  make logs     # Ver logs"

setup: ## Configuração completa do sistema (primeira vez)
	@echo "$(BLUE)🚀 Configuração completa do sistema...$(NC)"
	./scripts/setup-docker.sh full

build: ## Construir imagem Docker
	@echo "$(BLUE)🔨 Construindo imagem Docker...$(NC)"
	docker-compose build --no-cache

start: ## Iniciar sistema
	@echo "$(BLUE)▶️  Iniciando sistema...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Sistema iniciado! Acesse: http://localhost:8000$(NC)"

stop: ## Parar sistema
	@echo "$(RED)⏹️  Parando sistema...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Sistema parado$(NC)"

restart: ## Reiniciar sistema
	@echo "$(YELLOW)🔄 Reiniciando sistema...$(NC)"
	docker-compose down
	docker-compose up -d
	@echo "$(GREEN)✅ Sistema reiniciado$(NC)"

logs: ## Ver logs do sistema
	@echo "$(BLUE)📋 Logs do sistema (Ctrl+C para sair):$(NC)"
	docker-compose logs -f

logs-backup: ## Ver logs de backup
	@echo "$(BLUE)📋 Logs de backup:$(NC)"
	tail -f ./logs/backup.log

status: ## Ver status do sistema
	@echo "$(BLUE)📊 Status do sistema:$(NC)"
	./scripts/docker-backup.sh status

backup: ## Executar backup manual
	@echo "$(BLUE)💾 Executando backup manual...$(NC)"
	./scripts/docker-backup.sh backup

backup-list: ## Listar backups disponíveis
	@echo "$(BLUE)📁 Backups disponíveis:$(NC)"
	./scripts/docker-backup.sh list

backup-menu: ## Menu de gerenciamento de backup
	./scripts/docker-backup.sh menu

restore: ## Restaurar backup (usar: make restore BACKUP=nome_do_arquivo)
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(RED)❌ Especifique o backup: make restore BACKUP=backup_20250730_133626.tar.gz$(NC)"; \
		./scripts/docker-backup.sh list; \
	else \
		./scripts/docker-backup.sh restore $(BACKUP); \
	fi

shell: ## Acessar shell do container
	@echo "$(BLUE)🐚 Acessando shell do container...$(NC)"
	docker-compose exec $(SERVICE_NAME) /bin/bash

django-shell: ## Acessar Django shell
	@echo "$(BLUE)🐍 Acessando Django shell...$(NC)"
	docker-compose exec $(SERVICE_NAME) python manage.py shell

migrate: ## Executar migrações Django
	@echo "$(BLUE)🔄 Executando migrações...$(NC)"
	docker-compose exec $(SERVICE_NAME) python manage.py migrate

collectstatic: ## Coletar arquivos estáticos
	@echo "$(BLUE)📁 Coletando arquivos estáticos...$(NC)"
	docker-compose exec $(SERVICE_NAME) python manage.py collectstatic --noinput

test: ## Executar testes
	@echo "$(BLUE)🧪 Executando testes...$(NC)"
	docker-compose exec $(SERVICE_NAME) python manage.py test

clean: ## Limpeza geral (containers, volumes, imagens)
	@echo "$(YELLOW)⚠️  Limpeza geral (cuidado!)$(NC)"
	@read -p "Tem certeza? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v
	docker system prune -f
	docker volume prune -f
	@echo "$(GREEN)✅ Limpeza concluída$(NC)"

clean-backups: ## Limpar backups antigos (manter últimos 10)
	@echo "$(BLUE)🧹 Limpando backups antigos...$(NC)"
	@ls -t backups/backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f || true
	@echo "$(GREEN)✅ Backups antigos removidos$(NC)"

info: ## Mostrar informações do sistema
	@echo "$(BLUE)=== Informações do Sistema CRAS ===$(NC)"
	@echo ""
	@echo "$(GREEN)📊 Status dos Containers:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(GREEN)💾 Backups Disponíveis:$(NC)"
	@ls -la backups/*.tar.gz 2>/dev/null | tail -5 || echo "  Nenhum backup encontrado"
	@echo ""
	@echo "$(GREEN)💽 Espaço em Disco:$(NC)"
	@df -h . | tail -1
	@echo ""
	@echo "$(GREEN)🌐 URLs:$(NC)"
	@echo "  Aplicação: http://localhost:8000"
	@echo "  Admin: http://localhost:8000/admin"

dev: ## Modo desenvolvimento (com hot reload)
	@echo "$(BLUE)🔧 Iniciando modo desenvolvimento...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

prod: ## Modo produção
	@echo "$(BLUE)🚀 Iniciando modo produção...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

update: ## Atualizar sistema (rebuild + restart)
	@echo "$(BLUE)⬆️  Atualizando sistema...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)✅ Sistema atualizado$(NC)"

monitor: ## Monitoramento em tempo real
	@echo "$(BLUE)📈 Monitoramento do sistema (Ctrl+C para sair):$(NC)"
	watch -n 5 'echo "=== Status ===" && docker-compose ps && echo "" && echo "=== Recursos ===" && docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" && echo "" && echo "=== Último Backup ===" && ls -la backups/backup_*.tar.gz 2>/dev/null | tail -1 || echo "Nenhum backup"'

# Targets especiais
.DEFAULT_GOAL := help

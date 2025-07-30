# Sistema de Backup Docker - CRAS
**Data:** 30/07/2025  
**Sistema:** Ficha de Identificação CRAS com Docker

## 🐳 Configuração Docker com Backup

### 📦 Componentes Adicionados

1. **Dockerfile Atualizado**
   - Instalação do `cron`, `sqlite3`, `tar`, `gzip`
   - Configuração automática do cron
   - Script de inicialização personalizado

2. **Docker Compose Atualizado**
   - Volumes persistentes para backups e logs
   - Healthcheck configurado
   - Serviço de monitoramento opcional
   - Volumes nomeados

3. **Scripts Docker-Específicos**
   - `backup-docker.sh` - Backup otimizado para containers
   - `docker-entrypoint.sh` - Inicialização do container
   - `docker-backup.sh` - Gerenciador completo

## 🚀 Como Usar

### Construir e Iniciar
```bash
# Construir a imagem
docker-compose build

# Iniciar sistema básico
docker-compose up -d

# Iniciar com monitoramento de backup
docker-compose --profile monitoring up -d
```

### Gerenciamento via Script
```bash
# Menu interativo
./docker-backup.sh menu

# Comandos diretos
./docker-backup.sh backup       # Backup manual
./docker-backup.sh list         # Listar backups
./docker-backup.sh logs         # Ver logs
./docker-backup.sh status       # Status do sistema
./docker-backup.sh restore backup_file.tar.gz
```

### Comandos Docker Compose
```bash
# Ver logs do backup em tempo real
docker-compose logs -f web | grep backup

# Executar backup manual no container
docker-compose exec web /app/scripts/backup-docker.sh

# Acessar shell do container
docker-compose exec web bash

# Ver logs de backup
docker-compose exec web tail -f /app/logs/backup.log
```

## 📁 Estrutura de Volumes

```
projeto/
├── backups/           # Volume persistente - backups
├── logs/              # Volume persistente - logs
├── media/             # Volume persistente - uploads
├── laudos/            # Volume persistente - laudos
├── db.sqlite3         # Volume persistente - banco
└── docker-backup.sh   # Script de gerenciamento
```

## ⏰ Agendamento Automático

- **Frequência:** Diário às 2:00 AM (horário do container)
- **Script:** `/app/scripts/backup-docker.sh`
- **Logs:** `/app/logs/backup.log`
- **Retenção:** 10 backups mais recentes

## 🔍 Monitoramento

### Verificar Status do Cron no Container
```bash
docker-compose exec web crontab -l
docker-compose exec web service cron status
```

### Ver Logs em Tempo Real
```bash
# Logs gerais do container
docker-compose logs -f web

# Logs específicos de backup
docker-compose exec web tail -f /app/logs/backup.log

# Com serviço de monitoramento
docker-compose logs -f backup-monitor
```

### Healthcheck
```bash
# Status do healthcheck
docker-compose ps
docker inspect <container_id> | grep Health -A 10
```

## 🔧 Backup Manual

### Via Script de Gerenciamento
```bash
./docker-backup.sh backup
```

### Via Docker Compose
```bash
docker-compose exec web /app/scripts/backup-docker.sh
```

### Via Docker Run
```bash
docker run --rm -v $(pwd)/backups:/app/backups \
  -v $(pwd)/db.sqlite3:/app/db.sqlite3 \
  -v $(pwd)/media:/app/media \
  -v $(pwd)/logs:/app/logs \
  ficha_identificacao_cras_web /app/scripts/backup-docker.sh
```

## 🔄 Restauração

### Via Script de Gerenciamento
```bash
./docker-backup.sh restore backup_20250730_120000.tar.gz
```

### Manual
```bash
# Parar container
docker-compose stop web

# Extrair backup
cd backups
tar -xzf backup_20250730_120000.tar.gz

# Restaurar arquivos
cp backup_20250730_120000/db_*.sqlite3 ../db.sqlite3
cp -r backup_20250730_120000/media_*/* ../media/

# Reiniciar
docker-compose start web
```

## 📊 Informações dos Backups Docker

Cada backup inclui:
- 📄 Banco de dados SQLite
- 📁 Arquivos de media e laudos
- 📋 Logs do sistema
- ⚙️ Configurações Django
- 🐳 Informações do container
- 🔍 Verificações de integridade

## 🚨 Troubleshooting Docker

### Container não inicia
```bash
# Ver logs de inicialização
docker-compose logs web

# Verificar build
docker-compose build --no-cache

# Limpar volumes órfãos
docker system prune -f
docker volume prune -f
```

### Cron não está funcionando
```bash
# Verificar no container
docker-compose exec web ps aux | grep cron
docker-compose exec web crontab -l

# Reiniciar serviço
docker-compose exec web service cron restart
```

### Backup falha
```bash
# Verificar permissões
docker-compose exec web ls -la /app/backups/
docker-compose exec web ls -la /app/scripts/

# Executar manualmente para debug
docker-compose exec web /app/scripts/backup-docker.sh
```

### Volumes não persistem
```bash
# Verificar volumes
docker volume ls
docker-compose config

# Recriar volumes
docker-compose down -v
docker-compose up -d
```

## 🔒 Segurança Docker

- ✅ Containers rodando como usuário não-root
- ✅ Volumes com permissões adequadas  
- ✅ Healthcheck para monitoramento
- ✅ Logs estruturados para auditoria
- ✅ Backups dentro do container isolado

## 📈 Performance

### Otimizações Implementadas
- `.dockerignore` configurado
- Multi-stage build (futuro)
- Volumes otimizados
- Limpeza automática de backups antigos

### Monitoramento de Recursos
```bash
# Uso de recursos
docker stats

# Espaço dos volumes
docker system df
```

## 🎯 Próximos Passos

1. **✅ Implementado** - Sistema funcionando
2. **Teste** - Validar em ambiente de desenvolvimento
3. **Produção** - Deploy com volumes externos
4. **Monitoramento** - Integrar com sistemas de alerta
5. **Backup Remoto** - Integrar com cloud storage

---

**🐳 Sistema Docker com Backup Totalmente Configurado!**  
**Primeira execução automática:** Amanhã às 2:00 AM (horário do container)

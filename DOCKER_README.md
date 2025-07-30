# 🐳 Sistema CRAS com Docker e Backup Automático

## 📋 Visão Geral

Este sistema integra o **Ficha de Identificação CRAS** com Docker e um sistema completo de backup automático.

### ✨ Principais Funcionalidades

- 🌐 **Aplicação Django** rodando em container
- 💾 **Backup automático** diário às 2:00 AM
- 🗂️ **Persistência de dados** com volumes Docker
- 📊 **Monitoramento** integrado
- 🔄 **Restauração** completa do sistema
- 🛠️ **Gerenciamento** simplificado com scripts

## 🚀 Início Rápido

### 1. Configuração Completa (Primeira vez)

```bash
# Opção 1: Usando script automatizado
./scripts/setup-docker.sh full

# Opção 2: Usando Makefile
make setup

# Opção 3: Usando menu interativo
./scripts/setup-docker.sh menu
```

### 2. Acesso ao Sistema

Após a configuração, acesse:
- **Aplicação**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin

## 🛠️ Comandos Principais

### Gerenciamento do Sistema

```bash
# Iniciar sistema
make start
# ou
docker-compose up -d

# Parar sistema
make stop
# ou
docker-compose down

# Ver logs
make logs
# ou
docker-compose logs -f

# Status do sistema
make status
# ou
./scripts/docker-backup.sh status
```

### Sistema de Backup

```bash
# Backup manual
make backup
# ou
./scripts/docker-backup.sh backup

# Listar backups
make backup-list
# ou
./scripts/docker-backup.sh list

# Menu de backup
./scripts/docker-backup.sh menu

# Restaurar backup
make restore BACKUP=backup_20250730_133626.tar.gz
# ou
./scripts/docker-backup.sh restore backup_20250730_133626.tar.gz
```

### Desenvolvimento

```bash
# Acessar shell do container
make shell
# ou
docker-compose exec web /bin/bash

# Django shell
make django-shell
# ou
docker-compose exec web python manage.py shell

# Executar migrações
make migrate
# ou
docker-compose exec web python manage.py migrate
```

## 📁 Estrutura do Projeto

```
ficha_identificacao_cras/
├── 🐳 Docker
│   ├── Dockerfile                    # Imagem principal
│   ├── docker-compose.yml           # Configuração dos serviços
│   └── .env                         # Variáveis de ambiente
├── 💾 Scripts de Backup
│   ├── scripts/
│   │   ├── backup-docker.sh         # Backup no container
│   │   ├── docker-backup.sh         # Gerenciador externo
│   │   ├── setup-docker.sh          # Configuração automática
│   │   └── docker-entrypoint.sh     # Inicialização do container
├── 📊 Dados Persistentes
│   ├── backups/                     # Backups automáticos
│   ├── logs/                        # Logs do sistema
│   ├── media/                       # Arquivos de mídia
│   ├── laudos/                      # Laudos médicos
│   └── db.sqlite3                   # Banco de dados
├── 🔧 Utilitários
│   ├── Makefile                     # Comandos simplificados
│   └── DOCKER_README.md             # Esta documentação
└── 🌐 Aplicação Django
    ├── core/                        # Configurações Django
    ├── ficha/                       # App principal
    └── manage.py                    # Manager Django
```

## ⚙️ Configuração Detalhada

### Variáveis de Ambiente (.env)

```bash
# Django
DEBUG=False
SECRET_KEY=sua-chave-secreta-super-segura
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Backup
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *

# Container
CONTAINER_NAME=cras-web
```

### Volumes Docker

```yaml
volumes:
  - ./media:/app/media          # Arquivos de mídia
  - ./laudos:/app/laudos        # Laudos médicos  
  - ./backups:/app/backups      # Backups
  - ./logs:/app/logs            # Logs
  - ./db.sqlite3:/app/db.sqlite3 # Banco de dados
```

## 📊 Sistema de Backup

### 🔄 Backup Automático

- **Frequência**: Diário às 2:00 AM
- **Retenção**: 15 backups mais recentes
- **Compressão**: tar.gz
- **Localização**: `./backups/`

### 📦 Conteúdo dos Backups

```
backup_YYYYMMDD_HHMMSS.tar.gz
├── db_YYYYMMDD_HHMMSS.sqlite3      # Banco de dados
├── logs_YYYYMMDD_HHMMSS/           # Logs
├── media_YYYYMMDD_HHMMSS/          # Arquivos de mídia
├── laudos_YYYYMMDD_HHMMSS/         # Laudos
├── settings_YYYYMMDD_HHMMSS.py     # Configurações
└── backup_info.txt                 # Metadados
```

### 🔍 Monitoramento

```bash
# Status completo
./scripts/docker-backup.sh status

# Logs de backup
tail -f ./logs/backup.log

# Monitoramento em tempo real
make monitor
```

## 🚨 Procedimentos de Emergência

### Restauração Completa

1. **Parar o sistema**
   ```bash
   make stop
   ```

2. **Restaurar backup**
   ```bash
   ./scripts/docker-backup.sh restore backup_YYYYMMDD_HHMMSS.tar.gz
   ```

3. **Reiniciar sistema**
   ```bash
   make start
   ```

### Recuperação de Dados Específicos

```bash
# Extrair backup manualmente
cd backups
tar -xzf backup_20250730_133626.tar.gz

# Restaurar apenas banco
cp backup_20250730_133626/db_*.sqlite3 ../db.sqlite3

# Restaurar apenas media
cp -r backup_20250730_133626/media_*/* ../media/
```

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs web

# Verificar configuração
docker-compose config

# Rebuild completo
make clean
make setup
```

### Backup não funciona

```bash
# Verificar cron no container
docker-compose exec web crontab -l

# Testar backup manual
docker-compose exec web /app/scripts/backup-docker.sh

# Ver logs de backup
tail -f logs/backup.log
```

### Problemas de permissão

```bash
# Ajustar permissões
sudo chown -R $(whoami):$(whoami) backups/ logs/ media/

# Recriar volumes
docker-compose down -v
docker-compose up -d
```

### Espaço insuficiente

```bash
# Verificar espaço
df -h

# Limpar backups antigos
make clean-backups

# Limpeza geral Docker
docker system prune -f
```

## 📈 Otimização e Manutenção

### Limpeza Regular

```bash
# Limpar backups antigos (manter 10)
make clean-backups

# Limpeza geral do Docker
make clean

# Otimizar logs
docker-compose exec web find /app/logs -name "*.log" -mtime +30 -exec gzip {} \;
```

### Monitoramento de Performance

```bash
# Recursos do container
docker stats

# Monitoramento contínuo
make monitor

# Verificar saúde
docker-compose ps
```

## 🔒 Segurança

### Práticas Implementadas

- ✅ **Backup seguro** com verificação de integridade
- ✅ **Logs de auditoria** completos
- ✅ **Backup de segurança** antes de restaurações
- ✅ **Isolamento** com containers Docker
- ✅ **Variáveis de ambiente** para configuração sensível

### Recomendações

1. **Configure SECRET_KEY** forte no `.env`
2. **Use HTTPS** em produção
3. **Monitore logs** regularmente
4. **Teste restaurações** periodicamente
5. **Mantenha backups** em local externo

## 📞 Suporte

### Comandos de Diagnóstico

```bash
# Informações completas
make info

# Status do sistema
./scripts/docker-backup.sh status

# Verificar configuração
docker-compose config

# Logs detalhados
docker-compose logs --tail=100
```

### Scripts Disponíveis

- `scripts/setup-docker.sh` - Configuração automática
- `scripts/docker-backup.sh` - Gerenciamento de backup
- `scripts/backup-docker.sh` - Backup interno do container
- `Makefile` - Comandos simplificados

---

## 🎯 Resumo de Comandos Essenciais

| Ação | Comando |
|------|---------|
| **Configurar tudo** | `make setup` |
| **Iniciar sistema** | `make start` |
| **Parar sistema** | `make stop` |
| **Ver logs** | `make logs` |
| **Backup manual** | `make backup` |
| **Listar backups** | `make backup-list` |
| **Restaurar** | `make restore BACKUP=arquivo.tar.gz` |
| **Status** | `make status` |
| **Menu de ajuda** | `make help` |

**🚀 Sistema pronto para produção com backup automático integrado!**

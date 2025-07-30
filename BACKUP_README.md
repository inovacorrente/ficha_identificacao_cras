# Sistema de Backup Automático - CRAS
**Data de Configuração:** 30/07/2025
**Sistema:** Ficha de Identificação CRAS

## 🎯 Configuração Implementada

### ⏰ Agendamento Cron
```bash
0 2 * * * /home/labmaker/Documentos/projetosPrefeitura/ficha_identificacao_cras/scripts/backup.sh >> /home/labmaker/Documentos/projetosPrefeitura/ficha_identificacao_cras/logs/backup.log 2>&1
```
- **Frequência:** Diário às 2:00 AM
- **Log:** Todas as operações são registradas em `/logs/backup.log`
- **Status:** ✅ Ativo e funcionando

## 📁 Scripts Disponíveis

### 1. `/scripts/backup.sh`
**Função:** Backup completo automático
**Componentes protegidos:**
- 📄 Banco de dados SQLite (`db.sqlite3`)
- 📋 Logs de sistema (`/logs/`)
- 📁 Arquivos de media (`/media/`)
- 📋 Laudos médicos (`/laudos/`)
- ⚙️ Configurações (`settings.py`, `requirements.txt`, `manage.py`)

**Recursos:**
- Verificação de integridade do banco
- Compactação automática (.tar.gz)
- Limpeza automática (mantém 15 backups)
- Logs detalhados
- Monitoramento de espaço em disco

### 2. `/scripts/restore.sh`
**Função:** Restauração completa do sistema
**Uso:** `./scripts/restore.sh backup_YYYYMMDD_HHMMSS.tar.gz`

**Recursos:**
- Backup de segurança antes da restauração
- Verificação de integridade
- Ajuste automático de permissões
- Log de auditoria

### 3. `/scripts/monitor_backup.sh`
**Função:** Monitoramento do sistema de backup
**Mostra:**
- Status do serviço Cron
- Último backup realizado
- Espaço em disco disponível
- Últimas entradas do log

### 4. `/scripts/setup_cron.sh`
**Função:** Configuração inicial do sistema
**Usado para:** Instalar e configurar o cron automaticamente

## 📊 Estrutura dos Backups

```
backup_YYYYMMDD_HHMMSS.tar.gz
├── db_YYYYMMDD_HHMMSS.sqlite3          # Banco de dados
├── logs_YYYYMMDD_HHMMSS/               # Logs do sistema
├── media_YYYYMMDD_HHMMSS/              # Arquivos de media
├── laudos_YYYYMMDD_HHMMSS/             # Laudos médicos (se existir)
├── settings_YYYYMMDD_HHMMSS.py         # Configurações Django
├── requirements_YYYYMMDD_HHMMSS.txt    # Dependências
├── manage_YYYYMMDD_HHMMSS.py           # Script Django
└── backup_info.txt                     # Metadados do backup
```

## 🔧 Comandos Úteis

### Monitoramento
```bash
# Ver status do sistema
./scripts/monitor_backup.sh

# Ver logs em tempo real
tail -f /logs/backup.log

# Listar backups
ls -la /backups/

# Verificar cron
crontab -l | grep backup
```

### Backup Manual
```bash
# Executar backup imediatamente
./scripts/backup.sh

# Ver último backup
ls -la /backups/ | tail -1
```

### Restauração
```bash
# Listar backups disponíveis
./scripts/restore.sh

# Restaurar backup específico
./scripts/restore.sh backup_20250730_133626.tar.gz
```

## 📈 Política de Retenção
- **Backups mantidos:** 15 mais recentes
- **Limpeza:** Automática a cada execução
- **Logs antigos:** Compactados após 30 dias
- **Espaço monitorado:** Alerta se uso > 85%

## 🔒 Segurança
- ✅ Backup de segurança antes de restaurações
- ✅ Verificação de integridade do banco
- ✅ Logs de auditoria detalhados
- ✅ Permissões adequadas nos arquivos
- ✅ Compactação dos backups

## 📞 Troubleshooting

### Cron não executando
```bash
# Verificar status do serviço
systemctl status cron

# Reiniciar serviço
sudo systemctl restart cron

# Verificar logs do sistema
journalctl -u cron
```

### Espaço insuficiente
```bash
# Verificar espaço
df -h

# Limpeza manual
./scripts/monitor_backup.sh
rm /backups/backup_mais_antigo.tar.gz
```

### Restauração de emergência
```bash
# 1. Parar Django
pkill -f runserver

# 2. Restaurar backup
./scripts/restore.sh backup_YYYYMMDD_HHMMSS.tar.gz

# 3. Reiniciar sistema
cd /home/labmaker/Documentos/projetosPrefeitura/ficha_identificacao_cras
python manage.py runserver
```

## 📋 Teste Realizado
- **Data:** 30/07/2025 13:36:26
- **Backup criado:** `backup_20250730_133626.tar.gz`
- **Tamanho:** 1008K
- **Componentes:** ✅ DB, ✅ Logs, ✅ Media, ✅ Configurações
- **Status:** ✅ Sucesso

## 🚀 Próximos Passos
1. **Configurado e funcionando** - Sistema rodando automaticamente
2. **Monitoramento diário** - Verificar logs ocasionalmente
3. **Teste de restauração** - Testar processo em ambiente de desenvolvimento
4. **Backup offsite** - Considerar cópia para local externo (futuro)

---
**⚠️ IMPORTANTE:** 
- O sistema está configurado e funcionando
- Primeira execução automática: **31/07/2025 às 02:00**
- Backups são mantidos em `/backups/`
- Logs em `/logs/backup.log`

# 🐳 Docker - Ficha de Identificação CRAS

## Como usar o Docker

### 1. Construir e executar pela primeira vez
```bash
docker-compose up --build
```

### 2. Executar nas próximas vezes
```bash
docker-compose up
```

### 3. Executar em background (segundo plano)
```bash
docker-compose up -d
```

### 4. Parar os containers
```bash
docker-compose down
```

### 5. Ver logs
```bash
docker-compose logs -f
```

### 6. Reconstruir após mudanças no código
```bash
docker-compose up --build
```

## Acessar a aplicação

Após executar o comando, a aplicação estará disponível em:
- **URL:** http://localhost:8000
- **Admin:** http://localhost:8000/admin
  - **Usuário:** admin
  - **Senha:** admin123

## Comandos úteis

### Executar comandos Django dentro do container
```bash
# Exemplo: executar migrations
docker-compose exec web python manage.py migrate

# Exemplo: criar superusuário manualmente
docker-compose exec web python manage.py createsuperuser

# Exemplo: shell Django
docker-compose exec web python manage.py shell
```

### Ver containers em execução
```bash
docker ps
```

### Limpar containers e imagens antigas
```bash
docker-compose down --rmi all --volumes --remove-orphans
```

## Estrutura dos arquivos

- **Dockerfile:** Configuração da imagem Python/Django
- **docker-compose.yml:** Orquestração dos serviços
- **.dockerignore:** Arquivos ignorados no build
- **.env:** Variáveis de ambiente (já configurado)

## Persistência de dados

Os seguintes diretórios são mantidos fora do container:
- `./media/` - Arquivos enviados pelos usuários
- `./laudos/` - Laudos médicos em PDF
- `db.sqlite3` - Banco de dados (criado automaticamente)

## Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs web

# Reconstruir completamente
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Problema de permissões
```bash
# Linux/Mac: ajustar permissões
sudo chown -R $USER:$USER ./media ./laudos
```

### Limpar tudo e começar do zero
```bash
docker-compose down --volumes
docker system prune -a
docker-compose up --build
```

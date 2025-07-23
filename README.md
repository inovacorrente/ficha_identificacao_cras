# Ficha de Identificação CRAS

Este projeto é um sistema web para cadastro e gerenciamento de fichas de identificação do CRAS (Centro de Referência de Assistência Social). Ele utiliza Django no backend e um frontend separado com HTML, CSS e JS.

## Estrutura do Projeto

```
├── core/                # Configurações do Django
├── ficha/               # App principal do Django
│   └── templates/       # Templates HTML do Django
├── frontend/            # Frontend estático (HTML, CSS, JS)
├── templates/           # Templates globais
├── manage.py            # Gerenciador do Django
├── requirements.txt     # Dependências Python
├── Dockerfile           # Dockerização do backend
├── docker-compose.yml   # Orquestração Docker
```

## Pré-requisitos
  
## Configuração do .env


Para variáveis sensíveis (como chaves secretas, configurações de banco de dados, etc.), utilize um arquivo `.env` na raiz do projeto. 

Já existe um arquivo de exemplo chamado `.env.example`. Para começar, basta copiá-lo:

```bash
cp .env.example .env
```

Depois, edite o `.env` conforme necessário.

O Django pode ser configurado para ler essas variáveis usando pacotes como `python-dotenv` ou `django-environ`.

**Exemplo de um arquivo `.env`:**
```
SECRET_KEY=sua_chave_secreta_aqui
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost,0.0.0.0
```

> Lembre-se de nunca versionar o `.env` (adicione ao `.gitignore`).

Se necessário, adapte o código em `core/settings.py` para ler as variáveis do `.env`.
- Python 3.12+
- pip
- (Opcional) Docker e Docker Compose

## Instalação e Execução Local (sem Docker)

1. Clone o repositório:
   ```bash
   git clone https://github.com/HeitorLouzeiro/ficha_identificacao_cras.git
   cd ficha_identificacao_cras
   ```
2. Crie um ambiente virtual e ative:
   
   ### Linux/MacOS
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
   
   ### Windows
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```
   
   > O ambiente virtual é local para cada computador. Repita este passo em cada máquina onde for rodar o projeto.
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Aplique as migrações do banco de dados:
   ```bash
   python manage.py migrate
   ```
5. (Opcional) Crie um superusuário para acessar o admin:
   ```bash
   python manage.py createsuperuser
   ```
   
   > **Observação:** Este projeto já possui um script para criar um superusuário automaticamente. Basta executar:
   > ```bash
   > python create_superuser.py
   > ```
   > O usuário padrão criado será:
   > - **Usuário:** admin
   > - **Senha:** admin123
   > (Você pode alterar esses dados editando o arquivo `create_superuser.py`.)
6. Inicie o servidor:
   ```bash
   python manage.py runserver
   ```
7. Acesse o sistema em: http://127.0.0.1:8000/

## Utilizando Docker

1. Certifique-se de ter Docker e Docker Compose instalados.
2. Execute:
   ```bash
   docker-compose up --build
   ```
3. O sistema estará disponível em http://0.0.0.0:8000/

## Frontend

O frontend estático está na pasta `frontend/`. Você pode servir esses arquivos diretamente ou integrá-los ao backend conforme necessário.

## Observações

- O painel administrativo do Django pode ser acessado em `/admin`.
- As configurações do banco de dados padrão utilizam SQLite.
- Para produção, ajuste as configurações de segurança e banco de dados em `core/settings.py`.

---

Em caso de dúvidas, consulte o código ou abra uma issue no repositório.
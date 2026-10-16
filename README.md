# Base de Conhecimento

Aplicação web para registrar, organizar e consultar artigos por categoria. O sistema usa Vue no frontend, Node.js/Express no backend, PostgreSQL para os dados e MongoDB para estatísticas.

## Instalação no Linux com Docker

O Docker Compose inicia a aplicação e os bancos de dados. Consulte o [guia completo de implantação](DEPLOY_DOCKER.md) para instalar o Docker, configurar o administrador inicial, gerar os segredos e publicar o acesso com HTTPS.

Resumo dos comandos no servidor:

```sh
git clone https://github.com/LeonardoLucio/basedeconhecimento-network.git
cd basedeconhecimento-network
# Configure .env.production e os arquivos em secrets/ conforme DEPLOY_DOCKER.md
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

O banco de dados e os uploads são persistidos em volumes Docker. Faça backups regulares e não use `docker compose down -v` em produção.

## Desenvolvimento

Consulte [backend/README.md](backend/README.md) para configurar e iniciar os serviços locais. O `docker-compose.yml` na raiz sobe PostgreSQL e MongoDB para desenvolvimento; `docker-compose.prod.yml` é a configuração de produção.

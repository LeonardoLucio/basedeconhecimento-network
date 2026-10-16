# Base de Conhecimento

Aplicação web para registrar, organizar e consultar artigos por categoria. O sistema usa Vue no frontend e Node.js/Express no backend. PostgreSQL armazena os dados, incluindo o histórico das estatísticas.

## Instalação no Linux com Docker

O Docker Compose inicia a aplicação e o banco de dados. Consulte o [guia completo de implantação](DEPLOY_DOCKER.md) para configurar o administrador inicial, gerar os segredos e publicar o acesso com HTTPS.

```sh
git clone https://github.com/LeonardoLucio/basedeconhecimento-network.git
cd basedeconhecimento-network
```

Depois siga o guia para configurar `.env.production` e `secrets/` e inicie os serviços:

```sh
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans
```

O banco e os uploads são persistidos em volumes Docker. Faça backups regulares e não use `docker compose down -v` em produção.

## Desenvolvimento

Consulte [backend/README.md](backend/README.md) para configurar o ambiente local. O `docker-compose.yml` sobe o PostgreSQL para desenvolvimento; `docker-compose.prod.yml` configura a aplicação para produção.

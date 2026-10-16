# Implantação em servidor com Docker Compose

Esta implantação atende um único servidor: o frontend é publicado pelo Nginx e encaminha `/api` ao backend; PostgreSQL e MongoDB ficam apenas na rede interna do Compose. Artigos, uploads e bancos usam volumes persistentes.

## 1. Baixar o projeto no servidor

Clone o repositório e entre na pasta criada:

`sh
git clone https://github.com/LeonardoLucio/basedeconhecimento-network.git
cd basedeconhecimento-network
`

Os comandos abaixo devem ser executados na raiz dessa pasta.

## 2. Criar segredos no servidor

Na pasta `versao-final`, crie arquivos de segredo fora do controle de versão:

```sh
mkdir -p secrets
chmod 700 secrets
openssl rand -hex 32 > secrets/auth_secret.txt
openssl rand -hex 32 > secrets/postgres_password.txt
openssl rand -hex 18 > secrets/bootstrap_admin_password.txt
sudo chown -R 1000:1000 secrets
sudo chmod 700 secrets
sudo chmod 600 secrets/*.txt
```

Copie `.env.production.example` para `.env.production`, restrinja o arquivo e informe o e-mail que será usado no login:

```sh
cp .env.production.example .env.production
chmod 600 .env.production
```

Edite `BOOTSTRAP_ADMIN_EMAIL`. O nome inicial é `Admin`. A senha temporária vem de `secrets/bootstrap_admin_password.txt`; não há uma senha padrão `Admin/Admin` no código.

## 3. Subir a aplicação

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
```

O primeiro administrador é criado somente quando o banco ainda não contém um administrador. A senha temporária precisa ter pelo menos 16 caracteres e a aplicação exige uma nova senha pessoal, com pelo menos 12 caracteres, no primeiro acesso. Entre usando o e-mail configurado e a senha temporária. Após a troca, substitua o conteúdo do arquivo de senha temporária por outro valor aleatório e recrie o backend; isso remove a senha inicial do segredo montado sem alterar a conta já criada.

## 4. HTTPS e atualizações

O frontend fica vinculado por padrão a `127.0.0.1:8080`. Configure um proxy reverso HTTPS no servidor (por exemplo, Caddy ou Nginx) para encaminhar o domínio a essa porta. Não publique as portas do PostgreSQL ou do MongoDB na internet.

Para atualizar, mantenha `.env.production`, os arquivos de `secrets/` e os volumes; depois execute novamente o comando `up -d --build`. **Não use `docker compose down -v` em produção**, pois a opção `-v` remove os volumes com o banco e os uploads. Mantenha backups do PostgreSQL e do volume `article_uploads`; o MongoDB guarda as estatísticas históricas.

Os arquivos em `secrets/` são montados em somente leitura nos containers, mas continuam armazenados no host. Restrinja permissões e backups deles. Para um único servidor, Compose é suficiente; Kubernetes só passa a fazer sentido com múltiplos nós, alta disponibilidade ou uma plataforma de orquestração existente.

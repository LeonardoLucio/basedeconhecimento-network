# Implantação no Linux com Docker Compose

O Compose executa o frontend, o backend e o PostgreSQL. As estatísticas também são guardadas no PostgreSQL, então o servidor não precisa executar MongoDB. Artigos, uploads e dados do banco ficam em volumes persistentes.

## 1. Baixar o projeto

```sh
git clone https://github.com/LeonardoLucio/basedeconhecimento-network.git
cd basedeconhecimento-network
```

Execute os comandos seguintes na raiz do projeto clonado.

## 2. Criar os segredos

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

Copie o modelo de configuração e informe o e-mail que será usado no primeiro acesso:

```sh
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

O nome inicial da conta é `Admin`. A senha temporária está em `secrets/bootstrap_admin_password.txt`; não existe uma senha padrão `Admin/Admin`. A senha temporária deve ter pelo menos 16 caracteres. No primeiro acesso, o sistema exige uma nova senha pessoal com pelo menos 12 caracteres.

## 3. Iniciar a aplicação

```sh
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans
sudo docker compose --env-file .env.production -f docker-compose.prod.yml ps
sudo docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 backend
```

`--remove-orphans` remove containers de versões anteriores do Compose, como o MongoDB usado em versões antigas desta aplicação. Ele não apaga volumes. Não use `docker compose down -v` em produção.

Para consultar a senha temporária:

```sh
sudo cat secrets/bootstrap_admin_password.txt
```

Após trocar a senha no primeiro acesso, substitua o valor temporário do arquivo por outro valor aleatório. Isso remove a senha inicial do segredo montado sem alterar a conta já criada.

## 4. HTTPS e atualizações

Por padrão, o frontend fica vinculado apenas a `127.0.0.1`, então só aceita conexões feitas no próprio servidor. Para acessá-lo de outros dispositivos da rede local, descubra o IP LAN do servidor com `ip -4 addr`, defina esse endereço em `WEB_BIND_ADDRESS` no `.env.production` e mantenha a porta indicada em `WEB_PORT`. Recrie o frontend com `sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate frontend`. Acesse `http://IP-LAN-DO-SERVIDOR:PORTA`.

Para acesso pela internet, configure um proxy reverso HTTPS, como Caddy ou Nginx. Não publique a porta do PostgreSQL na internet.

Para atualizar, mantenha `.env.production`, os arquivos de `secrets/` e os volumes; depois execute novamente o comando `up -d --build`. Faça backups regulares do PostgreSQL e do volume `article_uploads`. Os arquivos em `secrets/` ficam no host e devem ser protegidos também nos backups.

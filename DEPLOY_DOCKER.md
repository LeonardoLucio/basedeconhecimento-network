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

Por padrão, o frontend fica vinculado a `0.0.0.0`, aceitando conexões em todas as interfaces de rede do servidor. Acesse `http://IP-DO-SERVIDOR:PORTA`, usando a porta definida em `WEB_PORT` (8888 no exemplo desta implantação). Para limitar o acesso, defina em `WEB_BIND_ADDRESS` um IP específico do servidor. O firewall do servidor, o roteador e as regras do provedor ainda podem bloquear conexões. Para acesso pela internet, use HTTPS com um proxy reverso e proteja o acesso no firewall.

Para acesso pela internet, configure um proxy reverso HTTPS, como Caddy ou Nginx. Não publique a porta do PostgreSQL na internet.

Para atualizar, mantenha `.env.production`, os arquivos de `secrets/` e os volumes; depois execute novamente o comando `up -d --build`. Faça backups regulares do PostgreSQL e do volume `article_uploads`. Os arquivos em `secrets/` ficam no host e devem ser protegidos também nos backups.

## 5. Atualizando de uma versão anterior (importante)

Esta versão inclui a migração `convert_article_content_to_text`, que converte a coluna `articles.content` de `bytea` para `text`. Isso corrige o erro `invalid input syntax for type bytea` ao salvar artigos com barra invertida (`\`), como comandos com continuação de linha. A migração roda sozinha quando o backend inicia, mas **faça um backup antes**:

```sh
sudo docker compose --env-file .env.production -f docker-compose.prod.yml exec postgres \
  pg_dump -U knowledge knowledge > backup-$(date +%F).sql
```

## 6. Medidas de segurança incluídas

- Limite de tentativas de login (10 falhas a cada 15 minutos por IP) e resposta genérica para e-mail ou senha inválidos.
- Cabeçalhos de segurança no backend (Helmet) e no Nginx (CSP, X-Frame-Options, nosniff, Referrer-Policy).
- CORS desativado por padrão; defina `CORS_ORIGINS` apenas se precisar acessar a API de outro domínio.
- Senhas definidas por administradores exigem 12 a 128 caracteres e forçam troca no próximo acesso.
- O token de sessão expira em 24 horas.
- Conteúdo dos artigos sanitizado no servidor e no navegador; comandos são tratados apenas como texto.

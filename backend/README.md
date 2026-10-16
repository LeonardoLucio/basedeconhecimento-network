# Backend

## Requisitos

- Node.js 20.19 ou superior (linha 20) ou Node.js 22.3 ou superior
- PostgreSQL

Os dados da aplicação, anexos e histórico das estatísticas ficam no PostgreSQL.

## Configuração local

O arquivo `env_file` é um módulo JavaScript de exemplo, não um arquivo dotenv. Copie-o para `.env` e configure `authSecret` e os dados do PostgreSQL. Não versione `.env`.

Para iniciar o PostgreSQL localmente com Docker, execute na raiz `versao-final`:

```sh
docker compose up -d
```

Copie `backend/env_file` para `backend/.env` e configure o banco `knowledge`, o usuário `knowledge`, a senha local de desenvolvimento e um segredo de autenticação. Essas credenciais são apenas para desenvolvimento local.

No PowerShell:

```powershell
Copy-Item backend\env_file backend\.env
```

## Execução

```sh
npm ci
npm run dev
```

`npm start` inicia o servidor sem monitor de desenvolvimento. As migrações do PostgreSQL são aplicadas antes de o backend começar a aceitar requisições. Para aplicá-las separadamente, use `npm run migrate`.

Ao cadastrar artigos, apenas o nome é obrigatório. Descrição, imagem, conteúdo, categoria e autor são opcionais.

## Anexos e importação de documentos

Na administração de artigos, salve o artigo antes de selecionar um arquivo. PDF, DOC e DOCX de até 20 MB são aceitos. O backend extrai texto e imagens rasterizadas de PDF e DOCX, e a interface acrescenta ambos ao campo **Conteúdo**; o documento original fica disponível para download aos leitores autenticados. A extração de imagens tem limite agregado de 10 MB por documento. PDFs compostos apenas por imagens não passam por OCR.

Arquivos e imagens extraídas são guardados em `backend/uploads`, fora da pasta pública; as imagens são servidas pela API autenticada. Os metadados ficam no PostgreSQL. Em produção, persista e faça backup dessa pasta junto com o banco.

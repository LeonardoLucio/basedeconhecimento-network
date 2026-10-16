# Backend

## Requisitos

- Node.js 20.19.x ou 22.3 ou superior
- PostgreSQL (dados da aplicação)
- MongoDB (estatísticas)

## Configuração

O arquivo `env_file` é um módulo JavaScript de exemplo, não um arquivo dotenv.
Copie-o para `backend/.env`, informe `authSecret` e as credenciais do
PostgreSQL, e ajuste `mongodbUri` se o MongoDB não estiver na máquina local.
Não versione `backend/.env`.

Para desenvolvimento, também é possível iniciar os dois bancos com Docker
Desktop, sem instalá-los individualmente:

```sh
docker compose up -d
```

Execute o comando acima na pasta `knowledge/versao-final`, onde está o
`docker-compose.yml`. Antes de iniciar o backend, copie `backend/env_file`
para `backend/.env` e configure `authSecret`, `database: 'knowledge'`,
`user: 'knowledge'` e `password: 'knowledge_dev'`. Mantenha a URI MongoDB como
`mongodb://127.0.0.1:27017/knowledge_stats`. Essas credenciais são apenas para
desenvolvimento local.

No PowerShell, a cópia do arquivo de configuração pode ser feita com:

```powershell
Copy-Item backend\env_file backend\.env
```

## Execução

```sh
npm ci
npm run dev
```

`npm start` inicia o servidor sem o monitor de desenvolvimento. As migrações
do PostgreSQL são aplicadas e as conexões com PostgreSQL e MongoDB são
verificadas antes de o servidor começar a aceitar requisições. Se qualquer
conexão falhar, o backend encerra com o erro em vez de continuar parcialmente.
Para aplicar as migrações separadamente, use `npm run migrate`.

Ao cadastrar artigos, apenas o nome é obrigatório. Descrição, imagem, conteúdo,
categoria e autor são opcionais.

## Anexos e importação de documentos

Na administração de artigos, salve o artigo antes de selecionar um arquivo.
PDF, DOC e DOCX de até 20 MB são aceitos. O backend extrai o texto e as imagens
rasterizadas de PDF e DOCX, e a interface acrescenta ambos ao campo
**Conteúdo**; o documento original é mantido para download pelos leitores
autenticados. A extração de imagens tem limite agregado de 10 MB por documento.
Em PDFs compostos apenas por imagens, as imagens são importadas, mas OCR para
reconhecer o texto nelas não está incluído. O destaque de código usa a ação
**Bloco de código** do editor.

Arquivos e imagens extraídas são guardados em `backend/uploads`, fora da pasta
pública; as imagens são servidas pela API autenticada. Os metadados ficam no
PostgreSQL. A migração da tabela de anexos é executada na inicialização, como
as demais. Em produção, persista e faça backup dessa pasta junto com o banco;
armazenar arquivos apenas no disco local não é adequado a instâncias efêmeras
ou com vários servidores.

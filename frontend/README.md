# Frontend Vue 3

## Requisitos

- Node.js 20.19 ou superior

## Instalação

```sh
npm ci
```

### Desenvolvimento

Inicie o backend e os bancos de dados em terminais separados. Em seguida, na
pasta `frontend`, execute:

```sh
npm ci
npm run serve
```

O Vite informa o endereço local no terminal (normalmente
`http://localhost:5173`). A interface usa a API do backend em
`http://localhost:4000`.

Na administração, apenas o nome do artigo é obrigatório. Salve o artigo antes
de importar um PDF, DOC ou DOCX. O texto extraído é acrescentado ao editor e
salvo automaticamente; o arquivo original fica disponível para download na
página do artigo. Selecione um trecho do editor e use **Bloco de código** para
formatá-lo como código destacado.

### Build de produção

```sh
npm run build
```

### Lint

```sh
npm run lint
```

O servidor de produção deve encaminhar as rotas da aplicação (por exemplo,
`/admin`) para `index.html`, pois o Vue Router usa o modo history.

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

Na administração, apenas o nome do artigo é obrigatório. Arraste um PDF, DOC
ou DOCX para a área de importação ou selecione o arquivo. Em artigos já salvos,
é possível importar vários documentos; em um artigo novo, importe um arquivo,
salve o artigo e depois adicione os demais. O texto extraído é acrescentado ao
editor e salvo automaticamente; os originais ficam disponíveis para download
na página do artigo e podem ser removidos na edição. Remover o original mantém
o texto importado e remove do conteúdo as imagens extraídas daquele arquivo.
Na lista de artigos, administradores podem usar o ícone de edição para abrir o
artigo diretamente na administração. Selecione um trecho do editor e use
**Bloco de código** para formatá-lo como código destacado.
O autor é preenchido automaticamente com o usuário conectado e não pode ser
selecionado manualmente; ao salvar alterações, o usuário conectado passa a ser
o autor do artigo.

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

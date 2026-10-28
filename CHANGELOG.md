# Alterações desta versão

## v1.2.0
- Importação de documentos por arrastar e soltar, com suporte a vários arquivos em artigos já salvos.
- Gerenciamento dos anexos importados: exclusão do original preservando o texto extraído e removendo as imagens correspondentes.
- Atalho para editar artigos diretamente na lista, disponível para administradores.
- Autor preenchido automaticamente com o usuário conectado; o backend ignora autores enviados pelo cliente.

## v1.1.0

## Correção: erro ao salvar comandos com `\` (ex.: pfSense)
- Causa: `articles.content` era `bytea`; o PostgreSQL interpretava `\` como escape binário.
- Nova migração `20261028120000_convert_article_content_to_text` converte a coluna para `text` (roda sozinha ao iniciar o backend; faça backup antes).

## Segurança
- Limite de tentativas de login, resposta genérica e tempo constante (sem enumerar e-mails).
- Helmet no backend, cabeçalhos/CSP no Nginx, CORS desativado por padrão, token HS256 fixo, expiração de 24 h.
- Sanitização do HTML mais estrita (classes, esquemas de URL, imagens data: só PNG/JPG/GIF/WEBP), links com `rel="noopener noreferrer"`.
- Validação de IDs, categoria/autor existentes, URL de imagem e tamanhos; sem vazar erros internos.
- Proteção contra ciclo em categorias (evitava recursão infinita), senha mínima de 12 caracteres para usuários criados por admin, bloqueio de auto-exclusão/auto-rebaixamento.
- 401 de senha incorreta não recarrega mais a página; só sessão expirada encerra a sessão.

## Interface e editor
- Novo visual (cores, sidebar, cards, login, painel admin).
- Editor: cores, alinhamento, recuo, botão "Bloco de comandos", contador, aviso de alterações não salvas, Ctrl+S, toolbar fixa.
- Artigos: blocos de comando com realce de sintaxe e botão **Copiar**.

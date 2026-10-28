/*
 * A coluna articles.content foi criada como `bytea` (table.binary). Ao enviar
 * texto para uma coluna bytea, o PostgreSQL interpreta o texto no formato de
 * escape binário, em que a barra invertida (\) é caractere especial. Por isso
 * conteúdos com "\" (ex.: comandos shell com continuação de linha) falhavam com
 * "invalid input syntax for type bytea". O conteúdo é HTML, então o tipo
 * correto é `text`.
 */
exports.up = async function (knex) {
    await knex.raw(`
        ALTER TABLE articles
        ALTER COLUMN content TYPE text
        USING convert_from(content, 'UTF8')
    `)
}

exports.down = async function (knex) {
    await knex.raw(`
        ALTER TABLE articles
        ALTER COLUMN content TYPE bytea
        USING convert_to(content, 'UTF8')
    `)
}

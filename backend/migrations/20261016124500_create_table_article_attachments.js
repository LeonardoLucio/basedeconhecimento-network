exports.up = function (knex) {
    return knex.schema.createTable('article_attachments', table => {
        table.increments('id').primary()
        table.integer('articleId').notNullable()
            .references('id').inTable('articles').onDelete('CASCADE')
        table.string('originalName', 255).notNullable()
        table.string('storedName', 80).notNullable().unique()
        table.string('mimeType', 150).notNullable()
        table.integer('size').notNullable()
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now())
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('article_attachments')
}

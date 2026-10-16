exports.up = async knex => {
    await knex.schema.createTable('stats', table => {
        table.increments('id').primary()
        table.integer('users').notNullable().defaultTo(0)
        table.integer('categories').notNullable().defaultTo(0)
        table.integer('articles').notNullable().defaultTo(0)
        table.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    })
}

exports.down = async knex => {
    await knex.schema.dropTableIfExists('stats')
}

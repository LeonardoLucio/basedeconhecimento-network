exports.up = async knex => {
    await knex.schema.createTable('user_category_access', table => {
        table.integer('userId').notNullable()
            .references('id').inTable('users').onDelete('CASCADE')
        table.integer('categoryId').notNullable()
            .references('id').inTable('categories').onDelete('CASCADE')
        table.primary(['userId', 'categoryId'])
    })

    await knex.raw(`
        INSERT INTO user_category_access ("userId", "categoryId")
        SELECT users.id, categories.id
        FROM users
        CROSS JOIN categories
        WHERE users.admin = false
          AND users."deletedAt" IS NULL
    `)
}

exports.down = async knex => {
    await knex.schema.dropTable('user_category_access')
}

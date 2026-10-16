exports.up = async knex => {
    await knex.schema.alterTable('users', table => {
        table.boolean('mustChangePassword').notNullable().defaultTo(false)
    })
}

exports.down = async knex => {
    await knex.schema.alterTable('users', table => {
        table.dropColumn('mustChangePassword')
    })
}

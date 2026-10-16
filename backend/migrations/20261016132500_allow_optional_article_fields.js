exports.up = function (knex) {
    return knex.schema.alterTable('articles', table => {
        table.string('description', 1000).nullable().alter()
        table.binary('content').nullable().alter()
        table.integer('userId').nullable().alter()
        table.integer('categoryId').nullable().alter()
    })
}

exports.down = function (knex) {
    return knex('articles')
        .whereNull('description')
        .orWhereNull('content')
        .orWhereNull('userId')
        .orWhereNull('categoryId')
        .count('id as count')
        .first()
        .then(result => {
            if (Number(result.count) > 0) {
                throw new Error(
                    'Não é possível exigir novamente os campos de artigo enquanto houver valores vazios.'
                )
            }
            return knex.schema.alterTable('articles', table => {
                table.string('description', 1000).notNullable().alter()
                table.binary('content').notNullable().alter()
                table.integer('userId').notNullable().alter()
                table.integer('categoryId').notNullable().alter()
            })
        })
}

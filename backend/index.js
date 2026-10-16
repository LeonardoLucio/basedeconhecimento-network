const app = require('express')()
const consign = require('consign')
const db = require('./config/db')
const bcrypt = require('bcryptjs')
const environment = require('./config/environment')

app.db = db

consign()
    .include('./config/passport.js')
    .then('./config/middlewares.js')
    .then('./api/validation.js')
    .then('./api')
    .then('./config/routes.js')
    .into(app)

const start = async () => {
    await db.migrate.latest()
    await ensureBootstrapAdmin()
    require('./schedule/statsSchedule')(app)
    app.listen(4000, () => {
        console.log('Backend executando...')
    })
}

const ensureBootstrapAdmin = async () => {
    const existingAdmin = await db('users')
        .where({ admin: true })
        .whereNull('deletedAt')
        .first('id')
    if (existingAdmin) return

    const { bootstrapAdminName, bootstrapAdminEmail, bootstrapAdminPassword } = environment
    if (!bootstrapAdminEmail || !bootstrapAdminPassword) {
        throw new Error(
            'Nenhum administrador existe. Configure BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD_FILE para criar o primeiro.'
        )
    }
    if (Array.from(bootstrapAdminPassword).length < 16) {
        throw new Error('A senha temporária do administrador deve ter ao menos 16 caracteres.')
    }

    await db('users').insert({
        name: bootstrapAdminName,
        email: bootstrapAdminEmail,
        password: bcrypt.hashSync(bootstrapAdminPassword, 12),
        admin: true,
        mustChangePassword: true
    })
    console.log(`Administrador inicial criado para ${bootstrapAdminEmail}; a troca de senha será exigida no primeiro acesso.`)
}

start().catch(error => {
    console.error('Não foi possível iniciar o backend ou conectar aos bancos:', error)
    db.destroy().finally(() => process.exit(1))
})

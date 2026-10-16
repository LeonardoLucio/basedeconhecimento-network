const fs = require('fs')
const path = require('path')

const localConfig = path.resolve(__dirname, '../.env')
const templateConfig = path.resolve(__dirname, '../env_file')
const configPath = fs.existsSync(localConfig) ? localConfig : templateConfig
const fileConfig = require(configPath)

const readSetting = name => {
    const secretPath = process.env[`${name}_FILE`]
    if (secretPath) return fs.readFileSync(secretPath, 'utf8').replace(/[\r\n]+$/, '')
    return process.env[name]
}

const config = {
    ...fileConfig,
    authSecret: readSetting('AUTH_SECRET') || fileConfig.authSecret,
    db: {
        ...fileConfig.db,
        host: process.env.DB_HOST || fileConfig.db.host,
        port: Number(process.env.DB_PORT || fileConfig.db.port || 5432),
        database: process.env.DB_NAME || fileConfig.db.database,
        user: process.env.DB_USER || fileConfig.db.user,
        password: readSetting('DB_PASSWORD') || fileConfig.db.password
    },
    mongodbUri: process.env.MONGODB_URI || fileConfig.mongodbUri,
    bootstrapAdminName: process.env.BOOTSTRAP_ADMIN_NAME || 'Admin',
    bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL || '',
    bootstrapAdminPassword: readSetting('BOOTSTRAP_ADMIN_PASSWORD') || ''
}

if (!config.authSecret || !config.db || !config.db.database || !config.db.user) {
    throw new Error(
        'Configure authSecret e os dados do PostgreSQL em backend/.env (use env_file como modelo).'
    )
}

config.mongodbUri = config.mongodbUri || 'mongodb://127.0.0.1:27017/knowledge_stats'

if (process.env.NODE_ENV === 'production' && config.authSecret.length < 32) {
    throw new Error('AUTH_SECRET deve ter pelo menos 32 caracteres em produção.')
}

module.exports = config

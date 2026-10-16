const { authSecret } = require('./environment')
const passport = require('passport')
const passportJwt = require('passport-jwt')
const { Strategy, ExtractJwt } = passportJwt

module.exports = app => {
    const params = {
        secretOrKey: authSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }

    const strategy = new Strategy(params, (payload, done) => {
        app.db('users')
            .where({ id: payload.id })
            .first()
            .then(user => done(null, user ? {
                ...payload,
                mustChangePassword: Boolean(payload.mustChangePassword || user.mustChangePassword)
            } : false))
            .catch(err => done(err, false))
    })

    passport.use(strategy)

    const authenticate = (options = {}) => (req, res, next) => {
        passport.authenticate('jwt', { session: false }, (error, user) => {
            if (error) return next(error)
            if (!user) return res.status(401).send('Token inválido.')
            req.user = user
            if (user.mustChangePassword && !options.allowPasswordChange) {
                return res.status(403).json({
                    code: 'PASSWORD_CHANGE_REQUIRED',
                    message: 'Altere sua senha antes de continuar.'
                })
            }
            return next()
        })(req, res, next)
    }

    return { authenticate }
}

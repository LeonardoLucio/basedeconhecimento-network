const cors = require('cors')

module.exports = app => {
    app.use(require('express').json())
    app.use(cors())
}
const mongoose = require('mongoose')
const { mongodbUri } = require('./environment')

module.exports = () => mongoose.connect(mongodbUri)
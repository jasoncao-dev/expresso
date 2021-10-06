const express = require('express')
const app = express()

const morgan = require('morgan')
const errorhandler = require('errorhandler')
const bodyParser = require('body-parser')
const cors = require('cors')

const apiRouter = require('./api/api')

const PORT = process.env.PORT || 4000

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cors())

app.use('/api', apiRouter)

app.use(errorhandler())

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}...`);
})

module.exports = app
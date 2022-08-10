require('dotenv').config()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const express = require('express')
const logger = require('morgan')
const mongoClient = require('mongoose')
const { inrsetDB } = require('./config/migrate')
// const rfs = require('rotating-file-stream')
// const { join } = require('path')

let infoDB = {
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 27017,
	name: process.env.DB_NAME || 'api-bank-server',
}

const mongoUrl = `mongodb://${infoDB.host}:${infoDB.port}/${infoDB.name}`
require('./main/queue')

mongoClient
	.connect(mongoUrl, {
		// authSource: infoDB.name,
		// user: 'admin',
		// pass: 'Dzl123hf5ga6bx',
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(async () => {
		console.log('✅ Connected database from mongodb.')
		await inrsetDB()
	})
	.catch((error) => console.error(`❌ Connect database is failed with error which is ${error}`))

const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 3000
// const accessLogStream = rfs.createStream('access.log', {
// 	interval: '1d', // rotate daily
// 	path: join(__dirname, 'log'),
// })

const app = express()
const adminRoute = require('./routes/admin')
const authRoute = require('./routes/auth')
const userRoute = require('./routes/user')
const securityRoute = require('./routes/security')
const rechargeRoute = require('./routes/recharge')
const bankRoute = require('./routes/bank')
const deckRoute = require('./routes/deck')
const priceRoute = require('./routes/price')
const walletRoute = require('./routes/wallet')
const notificationRoute = require('./routes/notification')

// adding Helmet to enhance your API's security
app.use(helmet())

app.use(cors())

// adding morgan to log HTTP requests
// app.use(isProduction ? logger('combined', { stream: accessLogStream }) : logger('dev'))
if (!isProduction) app.use(logger('dev'))

app.use(bodyParser.json())
app.use('/admin', adminRoute)
app.use('/auth', authRoute)
app.use('/user', userRoute)
app.use('/security', securityRoute)
app.use('/recharge', rechargeRoute)
app.use('/bank', bankRoute)
app.use('/deck', deckRoute)
app.use('/price', priceRoute)
app.use('/wallet', walletRoute)
app.use('/notification', notificationRoute)
app.get('/', (req, res, next) => {
	return res.status(201).json({
		success: true,
		message: 'Server is OK',
	})
})

app.use((req, res, next) => {
	const err = new Error('Not Found')
	err.status = 404
	next(err)
})

app.use((err, req, res, next) => {
	const status = err.status || 500
	return res.status(status).json({
		success: false,
		error: {
			message: err.message,
		},
	})
})

app.listen(port, () => console.log(`Server is listening on port ${port}`)).timeout = 10000

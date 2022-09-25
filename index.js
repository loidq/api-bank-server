require('dotenv').config()
const cookieParser = require('cookie-parser')

const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const express = require('express')
const logger = require('morgan')
const mongoClient = require('mongoose')

const { inrsetDB } = require('./config/migrate')
const requestIp = require('request-ip')
const sendMailQueue = require('./config/bullConfig')
const emailService = require('./config/emailSetup')
// const rfs = require('rotating-file-stream')
// const { join } = require('path')
const rateLimit = require('express-rate-limit')

let infoDB = {
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 27017,
	name: process.env.DB_NAME || 'api-server',
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
}
const isProduction = process.env.NODE_ENV === 'production'

let mongoUrl = `mongodb://${infoDB.user}:${infoDB.password}@${infoDB.host}:${infoDB.port}/${infoDB.name}`

if (!isProduction) mongoUrl = `mongodb://${infoDB.host}:${infoDB.port}/${infoDB.name}`

mongoClient
	.connect(mongoUrl, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(async () => {
		console.log('✅ Connected database from mongodb.')
		await inrsetDB()
	})
	.catch((error) => console.error(`❌ Connect database is failed with error which is ${error}`))

require('./main/queue')

const port = process.env.PORT || 3000
// const accessLogStream = rfs.createStream('access.log', {
// 	interval: '1d', // rotate daily
// 	path: join(__dirname, 'log'),
// })

const app = express()
app.use(requestIp.mw())
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

const isLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 80,
	message: {
		success: false,
		error: {
			message: 'too many requests sent by this ip, please try again in a few minutes!',
		},
	},
	keyGenerator: (req, res) => {
		return req.clientIp // IP address from requestIp.mw(), as opposed to req.ip
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const limiterAuth = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	message: {
		success: false,
		error: {
			message: 'too many requests sent by this ip, please try again in a few minutes!',
		},
	},
	keyGenerator: (req, res) => {
		return req.clientIp // IP address from requestIp.mw(), as opposed to req.ip
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

app.use(isLimiter)
app.use(cookieParser('18smvbyGHkan178DqpMj75RgVhB'))
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))

// app.use('/admin', adminRoute)
app.use('/auth', limiterAuth, authRoute)
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

sendMailQueue.process(2, (job, done) => {
	emailService.mailSender(job.data)
	done()
})

require('dotenv').config()
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const logger = require('morgan')
const mongoClient = require('mongoose')
require('./main/cron')
mongoClient
	.connect(process.env.MONGO_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('✅ Connected database from mongodb.'))
	.catch((error) => console.error(`❌ Connect database is failed with error which is ${error}`))

const app = express()
const authRoute = require('./routes/auth')
const userRoute = require('./routes/user')
const securityRoute = require('./routes/security')
const rechargeRoute = require('./routes/recharge')
const bankRoute = require('./routes/bank')
const deckRoute = require('./routes/deck')
const walletRoute = require('./routes/wallet')
app.use(cors())

app.use(logger('dev'))

app.use(bodyParser.json())
app.use('/auth', authRoute)
app.use('/user', userRoute)
app.use('/security', securityRoute)
app.use('/recharge', rechargeRoute)
app.use('/bank', bankRoute)
app.use('/deck', deckRoute)
app.use('/wallet', walletRoute)
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

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server is listening on port ${port}`)).timeout = 10000

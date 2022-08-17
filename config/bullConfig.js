const Queue = require('bull')

let clientRedis = {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
}

const redisUrl = `redis://${clientRedis.host}:${clientRedis.port}`

const sendMailQueue = new Queue('sendMail', redisUrl)

module.exports = sendMailQueue

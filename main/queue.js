const Bull = require('bull')
const Transaction = require('../models/Transaction')
const CronJobManager = require('cron-job-manager')
const manager = new CronJobManager()
const Deck = require('../models/Deck')
const Bank = require('../models/Bank')

let clientRedis = {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
}

const redisUrl = `redis://${clientRedis.host}:${clientRedis.port}`

const queueBrowseMomo = new Bull('browseMomo', redisUrl)
const queueDetailsMomo = new Bull('detailsMomo', redisUrl)
const queueBrowseZaloPay = new Bull('browseZaloPay', redisUrl)
const queueDetailsZaloPay = new Bull('detailsZaloPay', redisUrl)
const queueBalanceWallet = new Bull('balanceWallet', redisUrl)
const MoMo = require('./momo')
const ZaloPay = require('./zalopay')
const Proxy = require('../models/Proxy')
const dayjs = require('dayjs')
const axios = require('axios')

const cronBrowseMomo = async () => {
	let sleep = 10
	await queueBrowseMomo.empty()
	let data = await Deck.find(
		{
			type: 'momo',
			expired: {
				$gt: new Date(),
			},
			banks: {
				$ne: null,
			},
		},
		{
			_id: 0,
			banks: 1,
		}
	).populate({
		path: 'banks',
		match: {
			status: 1,
			bank: 'momo',
		},
		select: {
			owner: 1,
			jwt_token: 1,
			newLogin: 1,
		},
	})
	data = data.filter((item) => item.banks != null)

	const promises = data.map((item) => {
		sleep += 10
		queueBrowseMomo.add(item.banks, {
			delay: 301 + sleep,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 3500,
		})
	})
	await Promise.allSettled(promises)
}
const cronDetailsMomo = async () => {
	await queueDetailsMomo.empty()
	let sleep = 10
	let data = await Transaction.find(
		{
			status: false,
			bank: 'momo',
		},
		{
			transId: 1,
			serviceId: 1,
		}
	).populate({
		path: 'banks',
		match: {
			status: 1,
		},
		select: {
			_id: 0,
			jwt_token: 1,
		},
	})

	data = data.filter((item) => item.banks != null)
	const promises = data.map((item) => {
		sleep += 10
		queueDetailsMomo.add(item, {
			delay: 402 + sleep,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 3000,
		})
	})
	await Promise.allSettled(promises)
}
const cronBrowseZaloPay = async () => {
	await queueBrowseZaloPay.empty()
	let sleep = 10
	let data = await Deck.find(
		{
			type: 'zalopay',
			expired: {
				$gt: new Date(),
			},
			banks: {
				$ne: null,
			},
		},
		{
			_id: 0,
			banks: 1,
		}
	).populate({
		path: 'banks',
		match: {
			status: 1,
			bank: 'zalopay',
		},
		select: {
			owner: 1,
			jwt_token: 1,
			newLogin: 1,
		},
	})
	data = data.filter((item) => item.banks != null)
	const promises = data.map((item) => {
		sleep += 10
		queueBrowseZaloPay.add(item.banks, {
			delay: 503 + sleep,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 3000,
		})
	})
	await Promise.allSettled(promises)
}
const cronDetailsZaloPay = async () => {
	await queueDetailsZaloPay.empty()
	let sleep = 10
	let data = await Transaction.find(
		{
			status: false,
			bank: 'zalopay',
		},
		{
			transId: 1,
			serviceId: 1,
		}
	).populate({
		path: 'banks',
		match: {
			status: 1,
		},
		select: {
			_id: 0,
			jwt_token: 1,
		},
	})

	data = data.filter((item) => item.banks != null)
	const promises = data.map((item) => {
		sleep += 10
		queueDetailsZaloPay.add(item, {
			delay: 604 + sleep,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 2000,
		})
	})
	await Promise.allSettled(promises)
}

const cronBalanceWallet = async () => {
	await queueBalanceWallet.empty()
	let sleep = 10
	let data = await Deck.find(
		{
			type: { $in: ['momo', 'zalopay'] },
			expired: {
				$gt: new Date(),
			},
			banks: {
				$ne: null,
			},
		},
		{
			_id: 0,
			banks: 1,
			type: 1,
		}
	).populate({
		path: 'banks',
		match: {
			status: 1,
			bank: { $in: ['momo', 'zalopay'] },
		},
		select: {
			_id: 0,
			token: 1,
		},
	})

	data = data.filter((item) => item.banks != null)

	const promises = data.map((item) => {
		sleep += 10
		queueBalanceWallet.add(
			{
				bank: item.type,
				token: item.banks.token,
			},
			{
				delay: 506 + sleep,
				removeOnComplete: true,
				removeOnFail: true,
				attempts: 1,
				timeout: 3000,
			}
		)
	})
	await Promise.allSettled(promises)
}

const browse = async (bank) => {
	let { jwt_token } = bank
	if (!bank.page_token) bank.page_token = ''
	let startDate = dayjs(new Date().setDate(1)).hour(0).minute(0).second(0).millisecond(0).valueOf()
	let endDate = dayjs(new Date()).valueOf()
	let fromDate = bank.newLogin ? startDate : dayjs(new Date().setHours(new Date().getHours() - 1)).valueOf()
	let toDate = endDate.valueOf()

	let data = await ZaloPay.postAxios2(`https://sapi.zalopay.vn/v2/history/transactions?page_size=20&page_token=${bank.page_token}`, {
		Authorization: `Bearer ${jwt_token}`,
	})

	if (!data || !data?.transactions) return
	let transactions = data.transactions
	transactions.map(async (item) => {
		if (
			(item.category_id == 5 || item.category_id == 2) &&
			dayjs(item.trans_time).valueOf() <= toDate &&
			dayjs(item.trans_time).valueOf() >= fromDate &&
			item.status_info.status == 1
		) {
			const session = await Transaction.startSession()
			session.startTransaction()
			try {
				let check = await Transaction.findOne({
					bank: 'zalopay',
					banks: bank._id,
					transId: item.trans_id,
				})
				if (!check) {
					let transaction = new Transaction({
						bank: 'zalopay',
						owner: bank.owner,
						banks: bank._id,
						io: item.sign,
						serviceId: item.system_type,
						transId: item.trans_id,
						amount: item.trans_amount,
						time: item.trans_time,
					})
					await transaction.save()
				}
				await session.commitTransaction()
				session.endSession()
			} catch (error) {
				console.log('error save Transaction', error)
				await session.abortTransaction()
				session.endSession()
			}
		}
	})
	if (Boolean(data.next_page_token) && dayjs(transactions.pop().trans_time).valueOf() >= fromDate) {
		bank.page_token = data.next_page_token
		await queueBrowseZaloPay.add(bank, {
			delay: 500,
			removeOnComplete: true,
			removeOnFail: true,
			timeout: 3000,
		})
	} else if (bank.newLogin)
		await Bank.findByIdAndUpdate(bank._id, {
			newLogin: false,
		})
}
manager.add(
	'cronBrowse',
	`*/30 * * * * *`,
	() => {
		Promise.allSettled([cronBrowseMomo(), cronBrowseZaloPay()])
	},
	{ start: true }
)
manager.add(
	'cronDetails',
	`*/5 * * * * *`,
	() => {
		Promise.allSettled([cronDetailsMomo(), cronDetailsZaloPay()])
	},
	{ start: true }
)
manager.add(
	'cronPorxy',
	`*/15 * * * * *`,
	async () => {
		try {
			let { data: response, status } = await axios.get(
				'https://api.tinproxy.com/proxy/get-new-proxy?api_key=cg5CqSHoCop3EKtumyT28VQ6R1twkC5D&authen_ips=AUTHEN_IPS&location=random',
				{
					timeout: 5000,
					validateStatus: () => true,
				}
			)

			if (status != 200 || !response.data || !response.data.http_ipv4) return

			const ipPort = response.data.http_ipv4.split(':')
			await Proxy.findByIdAndUpdate('62d04051bdd86d759ccc4161', {
				host: ipPort[0],
				port: ipPort[1],
				auth: `${response.data.authentication.username}:${response.data.authentication.password}`,
			})
		} catch (e) {}
	},
	{
		start: true,
	}
)
manager.add(
	'cronBalance',
	`*/30 * * * * *`,
	async () => {
		cronBalanceWallet()
	},
	{
		start: true,
	}
)

queueBrowseMomo.process(10, (job, done) => {
	try {
		MoMo.browse(job.data)
	} catch {}

	done()
})
queueDetailsMomo.process(5, (job, done) => {
	try {
		MoMo.details(job.data)
	} catch {}

	done()
})
queueBrowseZaloPay.process(10, (job, done) => {
	try {
		browse(job.data)
	} catch {}

	done()
})
queueDetailsZaloPay.process(5, (job, done) => {
	try {
		ZaloPay.details(job.data)
	} catch {}

	done()
})
queueBalanceWallet.process(10, (job, done) => {
	try {
		axios.get(`http://localhost:3000/wallet/${job.data.bank}/getBalance`, {
			data: {
				token: job.data.token,
			},
			timeout: 3000,
			validateStatus: () => true,
		})
	} catch {}

	done()
})

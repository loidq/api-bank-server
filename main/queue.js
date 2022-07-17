const Bull = require('bull')
const Transaction = require('../models/Transaction')
const CronJobManager = require('cron-job-manager')
const manager = new CronJobManager()
const Deck = require('../models/Deck')
const Bank = require('../models/Bank')
const queueBrowseMomo = new Bull('browseMomo')
const queueDetailsMomo = new Bull('detailsMomo')
const queueBrowseZaloPay = new Bull('browseZaloPay')
const queueDetailsZaloPay = new Bull('detailsZaloPay')
const MoMo = require('./momo')
const ZaloPay = require('./zalopay')
const dayjs = require('dayjs')
const cronBrowseMomo = async () => {
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

	const promises = data.map((item) =>
		queueBrowseMomo.add(item.banks, {
			delay: 500,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 4000,
		})
	)
	await Promise.allSettled(promises)
}
const cronDetailsMomo = async () => {
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
	const promises = data.map((item) =>
		queueDetailsMomo.add(item, {
			delay: 500,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 3000,
		})
	)
	await Promise.allSettled(promises)
}
const cronBrowseZaloPay = async () => {
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
	const promises = data.map((item) =>
		queueBrowseZaloPay.add(item.banks, {
			delay: 500,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 3000,
		})
	)
	await Promise.allSettled(promises)
}

const cronDetailsZaloPay = async () => {
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
	const promises = data.map((item) =>
		queueDetailsZaloPay.add(item, {
			delay: 500,
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 1,
			timeout: 2000,
		})
	)
	await Promise.allSettled(promises)
}

manager.add(
	'cronBrowse',
	`*/30 * * * * *`,
	async () => {
		await Promise.allSettled([cronBrowseMomo(), cronBrowseZaloPay()])
	},
	{ start: true }
)
manager.add(
	'cronDetails',
	`*/5 * * * * *`,
	async () => {
		await Promise.allSettled([cronDetailsMomo(), cronDetailsZaloPay()])
	},
	{ start: true }
)
manager.add(
	'cronPorxy',
	`*/15 * * * * *`,
	async () => {
		try {
			let { data: response, status } = await axios.get(
				'https://api.tinproxy.com/proxy/get-new-proxy?api_key=cg5CqSHoCop3EKtumyT28VQ6R1twkC5D&authen_ips=AUTHEN_IPS&location=vn_hcm',
				{
					timeout: 3000,
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

	if (!data.transactions) return
	let transactions = data.transactions
	transactions.map(async (item) => {
		if (
			(item.category_id == 5 || item.category_id == 2) &&
			dayjs(item.trans_time).valueOf() <= toDate &&
			dayjs(item.trans_time).valueOf() >= fromDate &&
			item.status_info.status == 1
		) {
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

queueBrowseMomo.process(10, (job, done) => {
	MoMo.browse(job.data)
	done()
})
queueDetailsMomo.process(5, (job, done) => {
	MoMo.details(job.data)
	done()
})
queueBrowseZaloPay.process(10, (job, done) => {
	browse(job.data)
	done()
})
queueDetailsZaloPay.process(5, (job, done) => {
	ZaloPay.details(job.data)
	done()
})

const axios = require('axios')
manager.add(
	'cronBalance',
	`*/30 * * * * *`,
	async () => {
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
				token: 1,
			},
		})
		data = data.filter((item) => item.banks != null)

		Promise.allSettled(
			data.map((item) =>
				axios.get('http://localhost:3000/wallet/momo/getBalance', {
					data: {
						token: item.banks.token,
					},
					timeout: 2000,
					validateStatus: () => true,
				})
			)
		)
	},
	{
		start: true,
	}
)

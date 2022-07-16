const Bank = require('../models/Bank')
const Deck = require('../models/Deck')
const Proxy = require('../models/Proxy')
const Transaction = require('../models/Transaction')
const { browse, details, SOF_LIST_MANAGER_MSG } = require('./momo')
const axios = require('axios')
const CronJobManager = require('cron-job-manager')
const manager = new CronJobManager()

const cronBrowseNew = async () => {
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
			newLogin: true,
			bank: 'momo',
		},
		select: {
			owner: 1,
			jwt_token: 1,
			newLogin: 1,
		},
	})
	data = data.filter((item) => item.banks != null)

	Promise.allSettled(
		data.map(async (item) => {
			await browse(item.banks)
			await Bank.findByIdAndUpdate(item.banks._id, {
				newLogin: false,
			})
		})
	)
}

const cronBrowse = async () => {
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
			newLogin: false,
			bank: 'momo',
		},
		select: {
			owner: 1,
			jwt_token: 1,
			newLogin: 1,
		},
	})
	data = data.filter((item) => item.banks != null)
	Promise.allSettled(data.map(async (item) => await browse(item.banks)))
}

const cronDetails = async () => {
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

	Promise.allSettled(data.map(async (item) => await details(item)))
}

manager.add('cronBrowseNew', `*/5 * * * * *`, async () => {
	await cronBrowseNew()
})

manager.add('cronBrowse', `*/10 * * * * *`, async () => {
	await cronBrowse()
})
manager.add('cronDetails', `*/5 * * * * *`, async () => {
	await cronDetails()
})

manager.add('cronBalance', `*/10 * * * * *`, async () => {
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
})

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

console.log('Start Cron')
// manager.start('cronBrowseNew')
// manager.start('cronBrowse')
// manager.start('cronDetails')
// manager.start('cronBalance')
manager.start('cronPorxy')

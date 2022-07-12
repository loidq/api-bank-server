const Bank = require('../models/Bank')
const Deck = require('../models/Deck')
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

console.log('Start Cron')
// manager.start('cronBrowseNew')
// manager.start('cronBrowse')
// manager.start('cronDetails')
// manager.start('cronBalance')

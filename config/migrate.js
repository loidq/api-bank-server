const User = require('../models/User')
const Proxy = require('../models/Proxy')
const Price = require('../models/Price')
const dataUser = [
	{
		email: 'admin@gmail.com',
		phone: '0355555555',
		password: '$2a$10$UTIFPtKIMjkIRVC/w0wnpeNJpJkLSZCyQFFai4hIOWdxM/XYI18j2',
		is2FA: true,
		secret2FA: 'DRMFSSRQBMAQCEAP',
		session: 'eac0c175-2095-48a8-9f9b-5b052e703b60',
		amount: 0,
		errorPass: 0,
		errorBlock: 0,
		block: false,
		roles: ['user', 'admin'],
		decks: [],
		banks: [],
		createdAt: '1657212771761',
		updatedAt: '1658925586467',
		__v: 0,
		lastLogin: '1658925586467',
		name: 'Dang Quang Loi',
	},
]
const dataPrice = [
	{
		type: 'momo',
		amount: 10000,
		name: 'Ví MoMo',
		status: true,
	},
	{
		type: 'zalopay',
		amount: 10000,
		name: 'Ví ZaloPay',
		status: true,
	},
	{
		type: 'vcb',
		amount: 10000,
		name: 'Vietcombank',
		status: true,
	},
	{
		type: 'acb',
		amount: 10000,
		name: 'ACB',
		status: true,
	},
	{
		type: 'mbb',
		amount: 10000,
		name: 'MBBank',
		status: true,
	},
	{
		type: 'tpb',
		amount: 10000,
		name: 'TPBank',
		status: true,
	},
	{
		type: 'tcb',
		amount: 10000,
		name: 'Techcombank',
		status: false,
	},
	{
		amount: 10000,
		type: 'vtb',
		name: 'Vietinbank',
		status: true,
	},
]
const dataProxy = [
	{
		_id: '62d04051bdd86d759ccc4161',
		host: '116.109.18.163',
		port: '7005',
		createdAt: '1657815121996',
		updatedAt: '1658935397102',
		__v: 0,
		auth: 'LDOiHZAN:bR1wx16M',
	},
]

const inrsetDB = async () => {
	if (process.env.NODE_ENV === 'production') {
		let countUser = await User.countDocuments({})
		let countPrice = await Price.countDocuments({})
		let countProxy = await Proxy.countDocuments({})
		if (countUser == 0) await User.insertMany(dataUser)
		if (countPrice == 0) await Price.insertMany(dataPrice)
		if (countProxy == 0) await Proxy.insertMany(dataProxy)
	}
}
module.exports = {
	inrsetDB,
}

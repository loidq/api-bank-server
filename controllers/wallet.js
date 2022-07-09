const { newError, uuidv4 } = require('../helpers/routerHelpers')
const Bank = require('../models/Bank')
const Deck = require('../models/Deck')
const Transaction = require('../models/Transaction')
const createImei = async (req, res, next) => {
	if (!req.bank) req.bank = {}
	if (!req.bank.imei) req.bank.imei = uuidv4()

	let { bank } = req.value.params
	let { phone } = req.value.body

	if (await Bank.findOne({ bank, phone }))
		newError({
			status: 400,
			message: 'Tài khoản này đã tồn tại trong hệ thống.',
		})

	next()
}

const SEND_OTP_MOMO = async (req, res, next) => {
	const deck = req.deck
	const { _id } = req.user
	let { imei } = req.bank
	let { bank } = req.value.params
	let { phone } = req.value.body

	const newBank = new Bank({ bank, phone, imei, owner: _id, token: uuidv4(), decks: deck._id, status: 99 })
	await newBank.save()
	// Add newly created bank to the actual banks

	await Deck.findByIdAndUpdate(deck._id, {
		banks: newBank._id,
	})
	return res.status(200).json({
		success: true,
		message: 'Lấy OTP thành công.',
		data: {
			_id: newBank._id,
		},
	})
}

const CONFIRM_OTP_MOMO = async (req, res, next) => {
	return res.status(200).json({
		success: true,
		message: 'Thêm tài khoản thành công.',
		data: {},
	})
}

const CHECK_MONEY = async (req, res, next) => {
	let { balance, phone } = req.bank
	let { amount, password, numberPhone } = req.value.body
	if (amount > balance)
		newError({
			status: 400,
			message: 'Tài khoản của bạn không đủ số dư.',
		})
	if (password != req.bank.password)
		newError({
			status: 400,
			message: 'Mật khẩu của bạn không chính xác.',
		})
	if (numberPhone == phone)
		newError({
			status: 400,
			message: 'Tài khoản nhận phải khác tài khoản gửi',
		})
	next()
}

const GET_BALANCE = async (req, res, next) => {
	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: { balance: req.bank.balance },
	})
}

const GET_TRANSACTION = async (req, res, next) => {
	const { _id } = req.bank

	let page = req.query.page * 1 || 1
	let limit = req.query.limit * 1 || 5

	let skip = limit * (page - 1)
	// const data = await Transaction.find(
	// 	{
	// 		banks: _id,
	// 		status: true,
	// 	},
	// 	{ _id: 0, banks: 0, owner: 0, createdAt: 0, updatedAt: 0, __v: 0, status: 0, serviceId: 0 }
	// )
	// 	.limit(limit)
	// 	.skip(skip)
	// 	.sort({
	// 		time: 1,
	// 	})

	// let total = await Transaction.countDocuments({
	// 	banks: _id,
	// 	status: true,
	// })

	const result = await Promise.allSettled([
		Transaction.find(
			{
				banks: _id,
				status: true,
			},
			{ io: 1, transId: 1, partnerId: 1, partnerName: 1, amount: 1, postBalance: 1, time: 1, comment: 1, _id: 0 }
		)
			.limit(limit)
			.skip(skip)
			.sort({
				time: 1,
			}),
		Transaction.countDocuments({
			banks: _id,
			status: true,
		}),
	])
	const data = result[0].status === 'fulfilled' ? result[0].value : []
	const total = result[1].status === 'fulfilled' ? result[1].value : 0

	return res.status(200).json({ success: true, data, total })
}

module.exports = { createImei, SEND_OTP_MOMO, CONFIRM_OTP_MOMO, CHECK_MONEY, GET_BALANCE, GET_TRANSACTION }

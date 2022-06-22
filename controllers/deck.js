const { newError } = require('../helpers/routerHelpers')
const Bank = require('../models/Bank')

const Deck = require('../models/Deck')
const Price = require('../models/Price')
const User = require('../models/User')

const upgrade = async (req, res, next) => {
	const { amount, _id } = req.user
	const { type, period } = req.value.body
	let { amount: price } = await Price.findOne({ type })

	if (amount < price * period)
		newError({
			status: 400,
			message: 'Tài khoản của bạn không đủ tiền để thanh toán.',
		})
	await User.findByIdAndUpdate(_id, {
		amount: amount - price * period,
	})
	let expired = new Date().setMonth(new Date().getMonth() + period)
	const newDeck = new Deck({
		owner: _id,
		type,
		expired,
	})
	await newDeck.save()
	return res.status(200).json({
		success: true,
		message: 'Bạn đã nâng cấp thành công',
		data: {},
	})
}

const extend = async (req, res, next) => {
	const { bankID } = req.value.params
	const { amount, _id } = req.user
	const { type, period } = req.value.body
	let { amount: price } = await Price.findOne({ type })
	let check = await Bank.findOne({
		_id: bankID,
		owner: _id,
	})
	if (!check)
		newError({
			status: 400,
			message: 'Gia hạn không tồn tại, vui lòng tải lại trang.',
		})
	if (amount < price * period)
		newError({
			status: 400,
			message: 'Tài khoản của bạn không đủ tiền để thanh toán.',
		})
	await User.findByIdAndUpdate(_id, {
		amount: amount - price * period,
	})

	let expired = new Date().setMonth(new Date().getMonth() + period)
	await Deck.findByIdAndUpdate(check.decks, {
		expired,
	})
	return res.status(200).json({
		success: true,
		message: 'Bạn đã gia hạn thành công',
		data: {},
	})
}

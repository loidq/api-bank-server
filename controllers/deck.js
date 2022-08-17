const { newError } = require('../helpers/routerHelpers')
const Bank = require('../models/Bank')
const Deck = require('../models/Deck')
const Price = require('../models/Price')
const User = require('../models/User')
const { uuidv4 } = require('../helpers/routerHelpers')
const upgrade = async (req, res, next) => {
	const { amount, _id } = req.user
	const { type, period } = req.value.body
	let { amount: price, name, status } = await Price.findOne({ type })
	if (!status)
		return res.status(400).json({
			success: false,
			error: {
				message: 'Cổng thanh toán này đang bảo trì, vui lòng quay lại sau.',
			},
			data: {},
		})
	if (amount < price * period)
		return res.status(400).json({
			success: false,
			error: {
				message: 'Tài khoản của bạn không đủ tiền để thanh toán.',
			},

			data: {},
		})

	await User.findByIdAndUpdate(_id, {
		amount: amount - price * period,
	})
	let expired = new Date().setMonth(new Date().getMonth() + period)
	const newDeck = new Deck({
		owner: _id,
		type,
		expired,
		name,
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
	const { period } = req.value.body

	let check = await Bank.findOne({
		_id: bankID,
		owner: _id,
	})

	if (!check)
		newError({
			status: 400,
			message: 'Tài khoản gia hạn không tồn tại, vui lòng tải lại trang.',
		})
	let { amount: price, status } = await Price.findOne({ type: check.bank })
	if (!status)
		return res.status(400).json({
			success: false,
			error: { message: 'Cổng thanh toán này đang bảo trì, vui lòng quay lại sau.' },
			data: {},
		})
	if (amount < price * period)
		return res.status(400).json({
			success: false,
			error: { message: 'Tài khoản của bạn không đủ tiền để thanh toán.' },
			data: {},
		})

	await User.findByIdAndUpdate(_id, {
		amount: amount - price * period,
	})

	let expired = new Date().setMonth(new Date().getMonth() + period)
	let deck = await Deck.findById(check.decks)
	if (deck.expired > new Date()) expired = deck.expired.setMonth(deck.expired.getMonth() + period)

	await Deck.findByIdAndUpdate(check.decks, { expired })

	return res.status(200).json({
		success: true,
		message: 'Bạn đã gia hạn thành công',
		data: {},
	})
}

const listDeck = async (req, res, next) => {
	const { _id } = req.user

	let list = await Deck.find(
		{
			owner: _id,
		},
		{ _id: 0, expired: 1, type: 1, banks: 1, name: 1 }
	)
	let total = await Deck.countDocuments({
		owner: _id,
	})

	return res.status(200).json({
		success: true,
		message: 'Thành công.',
		data: { list, total },
	})
}

const checkDate = async (req, res, next) => {
	const { token } = req.value.body

	let bank = await Bank.findOne({
		token,
		bank: req.value.params.bank,
	})
	if (!bank)
		newError({
			status: 400,
			message: 'Token không tồn tại trong hệ thống.',
		})
	else if (bank.status == 0)
		newError({
			status: 400,
			message: 'Tài khoản đang tạm thời ngưng sử dụng.',
		})
	else if (bank.status == 2)
		newError({
			status: 400,
			message: 'Tài khoản đang bị khoá vui lòng inbox admin giải quyết.',
		})
	else if (bank.status == 3)
		newError({
			status: 400,
			message: 'Vui lòng đang nhập lại tài khoản.',
		})
	else if (bank.status == 99)
		newError({
			status: 400,
			message: 'Tài khoản tạm thời chưa sử dụng được.',
		})

	let check = await Deck.findOne({
		expired: {
			$gt: new Date(),
		},
		banks: bank._id,
		owner: bank.owner,
	})

	if (!check)
		newError({
			status: 400,
			message: 'Tài khoản đã hết hạn sử dụng, vui lòng gia hạn để tiếp tục sử dụng.',
		})
	req.bank = bank
	next()
}

const checkDateIdBank = async (req, res, next) => {
	const _id = req.value.body ? req.value.body._id : req.value.params.bankId

	let bank = await Bank.findOne({
		_id,
		bank: req.value.params.bank,
		owner: req.user._id,
	})
	if (!bank)
		newError({
			status: 400,
			message: 'Tài khoản không tồn tại trong hệ thống.',
		})
	else if (bank.status == 0)
		newError({
			status: 400,
			message: 'Tài khoản đang tạm thời ngưng sử dụng.',
		})
	else if (bank.status == 2)
		newError({
			status: 400,
			message: 'Tài khoản đang bị khoá vui lòng inbox admin giải quyết.',
		})
	else if (bank.status == 3)
		newError({
			status: 400,
			message: 'Vui lòng đang nhập lại tài khoản.',
		})
	else if (bank.status == 99)
		newError({
			status: 400,
			message: 'Tài khoản tạm thời chưa sử dụng được.',
		})

	let check = await Deck.findOne({
		expired: {
			$gt: new Date(),
		},
		banks: bank._id,
		owner: bank.owner,
	})

	if (!check)
		newError({
			status: 400,
			message: 'Tài khoản đã hết hạn sử dụng, vui lòng gia hạn để tiếp tục sử dụng.',
		})
	req.bank = bank
	next()
}

const checkExpired = async (req, res, next) => {
	const { bank: type } = req.value.params

	const { _id } = req.user
	let check = null

	if (type == 'momo' || type == 'zalopay') {
		let check1 = await Bank.findOne({
			owner: _id,
			bank: type,
			phone: req.value.body.phone,
			status: { $in: [3, 99] },
		}).populate({
			path: 'decks',
			match: {
				expired: {
					$gt: new Date(),
				},
				owner: _id,
			},
		})

		check =
			Boolean(check1) && check1.decks
				? {
						_id: check1.decks._id,
						type: check1.decks.type,
						expired: check1.decks.expired,
						owner: check1.decks.owner,
						banks: check1.decks.banks,
						imei: check1.imei,
				  }
				: await Deck.findOne({
						expired: {
							$gt: new Date(),
						},
						banks: null,
						owner: _id,
						type,
				  })
	} else
		check = await Deck.findOne({
			expired: {
				$gt: new Date(),
			},
			owner: _id,
			type,
			banks: null,
		})

	if (!check)
		newError({
			status: 400,
			message: 'Bạn cần nâng cấp để sử dụng.',
		})
	req.deck = check
	next()

	/*
	if (type == 'momo' || type == 'zalopay') console.log('TODO')
	else {
		let { username } = req.value.body
		if (await Bank.findOne({ bank: type, username }))
			newError({
				status: 400,
				message: 'Tài khoản này đã tồn tại trong hệ thống.',
			})

		const newBank = new Bank({ username, owner: _id, token: uuidv4(), decks:  })
		await newBank.save()
		// Add newly created bank to the actual banks
		decks.push(newBank._id)
		await owner.save()
	}
	*/
}
module.exports = {
	upgrade,
	extend,
	checkExpired,
	checkDate,
	listDeck,
	checkDateIdBank,
}

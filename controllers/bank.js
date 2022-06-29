const { newError, uuidv4 } = require('../helpers/routerHelpers')
const Bank = require('../models/Bank')
const Deck = require('../models/Deck')
const newBank = async (req, res, next) => {
	const deck = req.deck
	const { _id } = req.user
	let { bank } = req.value.params
	let { username } = req.value.body
	if (await Bank.findOne({ bank, username }))
		newError({
			status: 400,
			message: 'Tài khoản này đã tồn tại trong hệ thống.',
		})

	const newBank = new Bank({ bank, username, owner: _id, token: uuidv4(), decks: deck._id })
	await newBank.save()
	// Add newly created bank to the actual banks

	await Deck.findByIdAndUpdate(deck._id, {
		banks: newBank._id,
	})
	return res.status(200).json({
		success: true,
		message: 'Bạn đã thêm tài khoản thành công.',
		data: {},
	})
}

const deleteBank = async (req, res, next) => {
	const { bankID } = req.value.params
	const { _id } = req.user
	const bank = await Bank.findOne({ _id: bankID, owner: _id })

	if (!bank)
		return res.status(400).json({
			success: false,
			message: 'Tài khoản cần xoá không tồn tại. Vui lòng tải lại trang',
		})
	await bank.remove()

	await Deck.findByIdAndUpdate(bank.decks, { $unset: { banks: 1 } })

	return res.status(200).json({
		success: true,
		message: 'Bạn đã xoá tài khoản thành công.',
		data: {},
	})
}

const updateBank = async (req, res, next) => {
	const { bankID } = req.value.params
	const { status } = req.value.body
	const bank = await Bank.findOne({ _id: bankID, owner: req.user._id })
	if (!bank)
		return res.status(400).json({
			success: false,
			message: 'Tài khoản cần cập nhật không tồn tại. Vui lòng tải lại trang',
		})
	const result = await Bank.findOneAndUpdate({ _id: bankID, owner: req.user._id }, { status })
	// Check if put user, remove bank in user's model
	return res.status(200).json({ success: Boolean(result), data: {} })
}

const listBank = async (req, res, next) => {
	const { _id: userID } = req.user
	const { bank } = req.value.params

	const accounts = await Bank.find(
		{
			owner: userID,
			bank,
		},
		{
			username: 1,
			phone: 1,
			balance: 1,
			status: 1,
			createdAt: 1,
		}
	).populate({
		path: 'decks',
		select: {
			_id: 0,
			expired: 1,
		},
	})
	//const accounts = await await Bank.find({ owner: userID, bank },	{ username: 1, status: 1, createdAt: 1, bank: 1 }).limit(pageSize).skip(pageSize * (pageIndex - 1))

	return res.status(200).json({ success: true, data: { list: accounts, total: accounts.length } })
}

module.exports = {
	deleteBank,
	newBank,
	updateBank,
	listBank,
}

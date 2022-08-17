const User = require('../../models/User')
const Transaction = require('../../models/Transaction')
const Rechange = require('../../models/Recharge')
const Deck = require('../../models/Deck')
const Bank = require('../../models/Bank')

const getAllUser = async (req, res, next) => {
	let last_page = 1
	let page = req.query.page * 1 || 1
	let limit = req.query.size * 1 || 5
	let skip = limit * (page - 1)
	let result = await Promise.allSettled([User.find({}).limit(limit).skip(skip), User.countDocuments({})])

	const data = result[0].status === 'fulfilled' ? result[0].value : []
	const total = result[1].status === 'fulfilled' ? result[1].value : 0
	last_page = Math.ceil(total / limit)

	return res.status(200).json({ success: true, data, total, last_page })
}

const getUser = async (req, res, next) => {
	let { id } = req.value.params
	let user = await User.findById(id, {
		password: 0,
		session: 0,
		updatedAt: 0,
		decks: 0,
		banks: 0,
	})
	if (!user)
		return res.status(400).json({
			success: false,
			error: {
				message: 'Không tìm thấy tài khoản này.',
			},
			data: {},
		})
	return res.status(200).json({ success: true, message: 'Thành công', data: user })
}

const changePassword = async (req, res, next) => {
	const { id } = req.value.params
	const { password } = req.value.body
	let user = await User.findById(id)
	if (!user)
		return res.status(400).json({
			success: false,
			error: {
				message: 'Không tìm thấy tài khoản này.',
			},
			data: {},
		})
	let newPassword = await user.isChangePassword(password)
	const result = await User.findByIdAndUpdate(id, {
		password: newPassword,
	})
	return res.status(200).json({ success: Boolean(result), message: 'Thành công', data: {} })
}

const updateUser = async (req, res, next) => {
	const { id } = req.value.params
	const data = req.value.body
	let user = await User.findById(id)
	if (!user)
		return res.status(400).json({
			success: false,
			error: {
				message: 'Không tìm thấy tài khoản này.',
			},
			data: {},
		})
	await User.findByIdAndUpdate(id, data)
	return res.status(200).json({ success: true, message: 'Thành công', data: {} })
}

const deleteUser = async (req, res, next) => {
	let { id } = req.value.params
	let user = await User.findById(id)
	if (!user)
		return res.status(400).json({
			success: false,
			error: {
				message: 'Không tìm thấy tài khoản này.',
			},
			data: {},
		})
	const session = await User.startSession()
	session.startTransaction()
	try {
		await Promise.all([
			User.findByIdAndDelete(id),
			Transaction.deleteMany({
				owner: id,
			}),
			Rechange.deleteMany({
				owner: id,
			}),
			Deck.deleteMany({
				owner: id,
			}),
			Bank.deleteMany({
				owner: id,
			}),
		])
		await session.commitTransaction()
		session.endSession()
		return res.status(200).json({
			success: true,
			message: 'Thành công.',
			data: {},
		})
	} catch {
		await session.abortTransaction()
		session.endSession()
		return res.status(500).json({
			success: false,
			error: {
				message: 'Có lỗi trong quá trình sử lí, vui lòng thử lại sau.',
			},
			data: {},
		})
	}
}

module.exports = {
	getAllUser,
	getUser,
	changePassword,
	updateUser,
	deleteUser,
}

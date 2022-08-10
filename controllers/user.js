const { newError } = require('../helpers/routerHelpers')
const User = require('../models/User')
const Transaction = require('../models/Transaction')
const Rechange = require('../models/Recharge')
const Deck = require('../models/Deck')
const Bank = require('../models/Bank')
const getInfo = async (req, res, next) => {
	const { email, phone, amount, roles, createdAt, is2FA, lastLogin, name, telegram } = req.user
	return res.status(200).json({
		success: true,
		data: {
			name,
			email,
			phone,
			amount,
			telegram,
			roles,
			is2FA,
			createdAt,
			lastLogin,
		},
	})
}

const changePassword = async (req, res, next) => {
	const user = req.user
	const newUser = req.value.body
	const isCorrectPassword = await user.isValidPassword(newUser.currentPassword)
	if (!isCorrectPassword)
		newError({
			message: 'Mật khẩu cũ không chính xác.',
			status: 400,
		})
	delete newUser.currentPassword
	newUser.password = await user.isChangePassword(newUser.password)
	const result = await User.findByIdAndUpdate(user._id, newUser)
	return res.status(200).json({ success: Boolean(result), message: 'Thành công', data: {} })
}

const updateTelegram = async (req, res, next) => {
	const user = req.user
	const { username } = req.value.body
	await User.findByIdAndUpdate(user._id, {
		'telegram.username': username,
	})
	return res.status(200).json({ success: true, message: 'Thành công', data: {} })
}

const deleteUser = async (req, res, next) => {
	let { _id } = req.user

	const session = await User.startSession()
	session.startTransaction()
	try {
		await Promise.all([
			User.findByIdAndDelete(_id),
			Transaction.deleteMany({
				owner: _id,
			}),
			Rechange.deleteMany({
				owner: _id,
			}),
			Deck.deleteMany({
				owner: _id,
			}),
			Bank.deleteMany({
				owner: _id,
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
			message: 'Có lỗi trong quá trình sử lí, vui lòng thử lại sau.',
			data: {},
		})
	}
}

module.exports = {
	getInfo,
	changePassword,
	updateTelegram,
	deleteUser,
}

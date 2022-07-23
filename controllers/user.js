const { newError } = require('../helpers/routerHelpers')
const User = require('../models/User')

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

module.exports = {
	getInfo,
	changePassword,
	updateTelegram,
}

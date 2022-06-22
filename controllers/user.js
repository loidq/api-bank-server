const { newError } = require('../helpers/routerHelpers')
const User = require('../models/User')

const getInfo = async (req, res, next) => {
	const { email, phone, amount, roles, createdAt, is2FA, lastLogin } = req.user
	return res.status(200).json({
		success: true,
		data: {
			email,
			phone,
			amount,
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
	return res.status(200).json({ success: Boolean(result) })
}

module.exports = {
	getInfo,
	changePassword,
}

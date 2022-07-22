const { generateOTPToken, generateQRCode, verifyOTPToken } = require('../utils/2FA')
const { newError } = require('../helpers/routerHelpers')
const User = require('../models/User')

const generateQRCodeBase64 = async (req, res, next) => {
	const { email, secret2FA, is2FA } = req.user
	if (is2FA)
		newError({
			message: 'Bạn đã bật xác thực 2FA.',
			status: 400,
		})
	let input = generateOTPToken(email, process.env.DOMAIN, secret2FA)
	let image = await generateQRCode(input)
	return res.status(200).json({
		success: true,
		data: {
			image,
		},
	})
}

const verify2FA = async (req, res, next) => {
	const { secret2FA, is2FA, _id } = req.user
	const { otp } = req.value.body

	if (!is2FA) return next()

	if (is2FA && (!otp || `${otp}`.length != 6))
		newError({
			message: 'Vui lòng không để trống OTP.',
			status: 400,
		})
	let result = verifyOTPToken(otp, secret2FA)
	if (result) {
		await User.findByIdAndUpdate(_id, { is2FA: !is2FA })
		return res.status(200).json({
			success: true,
			message: is2FA ? 'Đã tắt xác thực 2FA thành công.' : 'Đã bật xác thực 2FA thành công.',
			data: {},
		})
	}
	newError({
		message: 'Mã xác thực OTP không chích xác.',
		status: 400,
	})
}

const verifyOTP = async (req, res, next) => {
	const { secret2FA, is2FA, _id } = req.user
	const { otp } = req.value.body

	if (!is2FA) return next()

	if (is2FA && (!otp || `${otp}`.length != 6))
		newError({
			message: 'Vui lòng không để trống OTP.',
			status: 400,
		})
	let result = verifyOTPToken(otp, secret2FA)
	if (result) next()
	else
		newError({
			message: 'Mã xác thực OTP không chích xác.',
			status: 400,
		})
}

module.exports = {
	generateQRCodeBase64,
	verify2FA,
	verifyOTP,
}

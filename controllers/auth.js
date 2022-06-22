const User = require('../models/User')
const { generateTempUniqueSecret } = require('../utils/2FA')
const JWT = require('jsonwebtoken')
const { md5, sha256, uuidv4 } = require('../helpers/routerHelpers')
const { JWT_SECRET } = require('../config/main')
const encodeToken = (userID, session) => {
	return JWT.sign(
		{
			iss: 'Sow',
			sub: userID,
			session: md5(session),
			iat: new Date().getTime(),
			exp: new Date().setDate(new Date().getDate() + 1),
		},
		JWT_SECRET
	)
}
const session = async (req, res, next) => {
	return res.status(200).json({
		success: true,
	})
}

const login = async (req, res, next) => {
	const token = encodeToken(req.user._id, req.user.session)
	res.setHeader('Authorization', token)
	return res.status(200).json({
		success: true,
		data: {
			token,
		},
	})
}

const register = async (req, res, next) => {
	const { email, phone, password } = req.value.body

	const foundUser = await User.findOne({ $or: [{ email }, { phone }] })
	if (foundUser)
		return res.status(403).json({
			success: false,
			error: {
				message: 'Email hoặc số điện thoại đã tồn tại.',
			},
		})

	const newUser = new User({ email, phone, password, session: uuidv4(), secret2FA: generateTempUniqueSecret() })

	await newUser.save()

	const token = encodeToken(newUser._id, newUser.session)
	res.setHeader('Authorization', token)

	const success = Boolean(newUser)
	return res.status(200).json({
		success,
		message: success ? 'Tạo tài khoản thành công' : 'Tạo tài khoản thất bại, vui lòng thử lại sau.',
	})
}

const refreshsession = async (req, res, next) => {
	const { _id: userID } = req.user

	const result = await User.findByIdAndUpdate(userID, { session: null })

	return res.status(200).json({
		success: Boolean(result),
	})
}

const forgetsession = async (req, res, next) => {
	const { _id: userID } = req.user

	const result = await User.findByIdAndUpdate(userID, { session: null })

	return res.status(200).json({
		success: Boolean(result),
	})
}

module.exports = {
	session,
	forgetsession,
	login,
	register,
	refreshsession,
}

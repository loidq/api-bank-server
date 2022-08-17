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
	const session = await User.startSession()
	session.startTransaction()
	try {
		const { email, phone, password, name } = req.value.body
		const foundUser = await User.findOne({ $or: [{ email }, { phone }] })
		if (foundUser)
			return res.status(403).json({
				success: false,
				error: {
					message: 'Email hoặc số điện thoại đã tồn tại.',
				},
			})

		const newUser = new User({ name: name, email: email, phone: phone, password: password, session: uuidv4(), secret2FA: generateTempUniqueSecret() })

		await newUser.save()

		const token = encodeToken(newUser._id, newUser.session)
		res.setHeader('Authorization', token)

		const success = Boolean(newUser)

		await session.commitTransaction()
		session.endSession()

		return res.status(201).json({
			success,
			message: success ? 'Tạo tài khoản thành công' : 'Tạo tài khoản thất bại, vui lòng thử lại sau.',
			data: {},
		})
	} catch (error) {
		console.log('error', error)
		await session.abortTransaction()
		session.endSession()
		next(error)
	}
}

const refreshsession = async (req, res, next) => {
	const { _id: userID } = req.user

	const result = await User.findByIdAndUpdate(userID, { session: null })

	return res.status(200).json({
		success: Boolean(result),
		data: {},
	})
}

const forgetsession = async (req, res, next) => {
	const { _id: userID } = req.user

	const result = await User.findByIdAndUpdate(userID, { session: null })

	return res.status(200).json({
		success: Boolean(result),
		data: {},
	})
}

module.exports = {
	session,
	forgetsession,
	login,
	register,
	refreshsession,
}

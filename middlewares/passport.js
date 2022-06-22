const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const LocalStrategy = require('passport-local').Strategy

const { JWT_SECRET } = require('../config/main')
const { md5, newError, uuidv4 } = require('../helpers/routerHelpers')
const { ExtractJwt } = require('passport-jwt')

const User = require('../models/User')

passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('Authorization'),
			secretOrKey: JWT_SECRET,
		},
		async (payload, done) => {
			try {
				const user = await User.findById(payload.sub)
				if (!user)
					newError({
						message: 'Phát hiện truy cập trái phép.',
						status: 401,
					})
				if (user.block)
					newError({
						message: 'Tài khoản của bạn đang bị khoá.',
						status: 401,
					})
				const checkTimeExp = payload.exp <= new Date().getTime()
				if (!user.session || md5(user.session) != payload.session || checkTimeExp)
					newError({
						message: 'Phiên bản đang nhập đã hết hạn.',
						status: 401,
					})

				done(null, user)
			} catch (error) {
				done(error, false)
			}
		}
	)
)
passport.use(
	new LocalStrategy(
		{
			usernameField: 'email',
		},
		async (email, password, done) => {
			try {
				const user = await User.findOne({ email })

				if (!user)
					//return done(null, false)
					newError({
						message: 'Thông tin đăng nhập không chính xác.',
						status: 400,
					})
				const isCorrectPassword = await user.isValidPassword(password)

				if (!isCorrectPassword) {
					const errorPass = ++user.errorPass

					const dataUpdate =
						errorPass < 5
							? { errorPass }
							: {
									errorPass,
									block: true,
							  }
					!user.block && (await User.findByIdAndUpdate(user._id, dataUpdate))
					newError({
						message: errorPass < 5 ? 'Mật khẩu không chính xác.' : 'Tài khoản bạn bị khoá do sai mật khẩu quá nhiều lần.',
						status: 400,
					})
				}
				if (user.block)
					newError({
						message: 'Tài khoản của bạn đang bị khoá.',
						status: 400,
					})
				const session = uuidv4()
				await User.findByIdAndUpdate(user._id, { session, errorPass: 0, lastLogin: new Date() })
				user.session = session
				done(null, user)
			} catch (error) {
				done(error, false)
			}
		}
	)
)

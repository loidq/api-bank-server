const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')
const Joi = require('@hapi/joi')

const newError = (error) => {
	const err = new Error(error.message)
	err.status = error.status
	throw err
}

const getRandomInt = (min, max) => {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

const md5 = (data) => crypto.createHash('md5').update(data).digest('hex')
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex')

const validateBody = (schema) => {
	return (req, res, next) => {
		const validatorResult = schema.validate(req.body)

		if (validatorResult.error) {
			return res.status(400).json({
				success: false,
				error: { message: validatorResult.error.details[0].message },
			})
		} else {
			if (!req.value) req.value = {}
			if (!req.value['params']) req.value.params = {}

			req.value.body = validatorResult.value
			next()
		}
	}
}

const validateQuery = (schema) => {
	return (req, res, next) => {
		const validatorResult = schema.validate(req.query)

		if (validatorResult.error) {
			return res.status(400).json({
				success: false,
				error: { message: validatorResult.error.details[0].message },
			})
		} else {
			if (!req.value) req.value = {}
			if (!req.value['queries']) req.value.queries = {}
			req.value.query = validatorResult.value
			next()
		}
	}
}

const validateParam = (schema, name) => {
	return (req, res, next) => {
		const validatorResult = schema.validate({ param: req.params[name] })

		if (validatorResult.error) {
			return res.status(400).json({
				success: false,
				error: { message: validatorResult.error.details[0].message },
			})
		} else {
			if (!req.value) req.value = {}
			if (!req.value['params']) req.value.params = {}

			req.value.params[name] = req.params[name]
			next()
		}
	}
}

const schemas = {
	idSchema: Joi.object().keys({
		param: Joi.string()
			.regex(/^[0-9a-zA-Z]{24}$/)
			.required(),
	}),
	loginSchema: Joi.object().keys({
		email: Joi.string()
			.email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
			.required()
			.messages({
				'string.email': `Địa chỉ email không hợp lệ`,
				'string.empty': `email không được bỏ trống`,
				'any.required': `Thiếu email gửi lên`,
			}),
		password: Joi.string().min(6).required().messages({
			'string.min': `Mật khẩu cần ít nhât 6 kí tự`,
			'string.empty': `Mật khẩu không được bỏ trống`,
			'any.required': `Thiếu mật khẩu gửi lên`,
		}),
	}),
	registerSchema: Joi.object().keys({
		phone: Joi.string()
			.regex(/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Thiếu email gửi lên`,
			}),

		email: Joi.string()
			.email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
			.required()
			.messages({
				'string.email': `Địa chỉ email không hợp lệ`,
				'string.empty': `email không được bỏ trống`,
				'any.required': `Thiếu email gửi lên`,
			}),
		password: Joi.string().min(6).required().messages({
			'string.min': `Mật khẩu cần ít nhât 6 kí tự`,
			'string.empty': `Mật khẩu không được bỏ trống`,
			'any.required': `Thiếu mật khẩu gửi lên`,
		}),
	}),
	changePasswordSchema: Joi.object().keys({
		password: Joi.string().min(6).required().messages({
			'string.min': `Mật khẩu cần ít nhât 6 kí tự`,
			'string.empty': `Mật khẩu không được bỏ trống`,
			'any.required': `Thiếu mật khẩu gửi lên`,
		}),
		currentPassword: Joi.string().min(6).required().messages({
			'string.min': `Mật khẩu cần ít nhât 6 kí tự`,
			'string.empty': `Mật khẩu không được bỏ trống`,
			'any.required': `Thiếu mật khẩu gửi lên`,
		}),
		surePassword: Joi.string().min(6).required().messages({
			'string.min': `Mật khẩu cần ít nhât 6 kí tự`,
			'string.empty': `Mật khẩu không được bỏ trống`,
			'any.required': `Thiếu mật khẩu gửi lên`,
		}),
	}),
	verifyOTP: Joi.object().keys({
		otp: Joi.string()
			.regex(/^[0-9]{6}$/)
			.required(),
	}),
	typeBankSchema: Joi.object().keys({
		param: Joi.string().valid('vcb', 'mbb', 'tpb', 'acb', 'tcb', 'vtb', 'momo').required(),
	}),
	typeWalletSchema: Joi.object().keys({
		param: Joi.string().valid('momo', 'zalopay').required(),
	}),

	newBankSchema: Joi.object().keys({
		username: Joi.string()
			.regex(/^[0-9a-zA-Z_-]+$/)
			.required(),
	}),
	bankOptionalSchema: Joi.object().keys({
		status: Joi.number().min(0).max(1).required(),
	}),
	upgradeSchema: Joi.object().keys({
		period: Joi.number().min(1).max(6).required(),
		type: Joi.string().valid('vcb', 'mbb', 'tpb', 'acb', 'tcb', 'vtb', 'momo', 'zalopay').required(),
	}),
	extendSchema: Joi.object().keys({
		period: Joi.number().min(1).max(6).required(),
	}),
	tranferData: Joi.object().keys({
		token: Joi.string()
			.guid({
				version: ['uuidv4'],
			})
			.required(),
		numberPhone: Joi.string()
			.regex(/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Thiếu email gửi lên`,
			}),
		amount: Joi.number().min(100).max(20000000).required(),
		comment: Joi.string().empty('').default(null),
		password: Joi.string()
			.regex(/^[0-9]{6}$/)
			.required(),
	}),
	getOTPWallet: Joi.object().keys({
		phone: Joi.string()
			.regex(/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Thiếu Số điện thoại gửi lên`,
			}),
	}),
	confirmOTPWallet: Joi.object().keys({
		phone: Joi.string()
			.regex(/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Thiếu email gửi lên`,
			}),
		otp: Joi.string()
			.regex(/^[0-9]{4}$/)
			.required(),
		password: Joi.string()
			.regex(/^[0-9]{6}$/)
			.required(),
		_id: Joi.string()
			.regex(/^[0-9a-zA-Z]{24}$/)
			.required(),
	}),
	tokenSchema: Joi.object().keys({
		token: Joi.string()
			.guid({
				version: ['uuidv4'],
			})
			.required(),
	}),
}

module.exports = {
	newError,
	uuidv4,
	md5,
	sha256,
	validateBody,
	validateQuery,
	validateParam,
	schemas,
	getRandomInt,
}

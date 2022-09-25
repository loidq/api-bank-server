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

const converterPhoneNumber = (phone) => {
	let arr = [
		{
			old: '016966',
			new: '03966',
		},
		{
			old: '0169',
			new: '039',
		},
		{
			old: '0168',
			new: '038',
		},
		{
			old: '0167',
			new: '037',
		},
		{
			old: '0166',
			new: '036',
		},
		{
			old: '0165',
			new: '035',
		},
		{
			old: '0164',
			new: '034',
		},
		{
			old: '0163',
			new: '033',
		},
		{
			old: '0162',
			new: '032',
		},
		{
			old: '0120',
			new: '070',
		},
		{
			old: '0121',
			new: '079',
		},
		{
			old: '0122',
			new: '077',
		},
		{
			old: '0126',
			new: '076',
		},
		{
			old: '0128',
			new: '078',
		},
		{
			old: '0123',
			new: '083',
		},
		{
			old: '0124',
			new: '084',
		},
		{
			old: '0125',
			new: '085',
		},
		{
			old: '0127',
			new: '081',
		},
		{
			old: '0129',
			new: '082',
		},

		{
			old: '01992',
			new: '059',
		},
		{
			old: '01993',
			new: '059',
		},
		{
			old: '01998',
			new: '059',
		},
		{
			old: '01999',
			new: '059',
		},
		{
			old: '0186',
			new: '056',
		},
		{
			old: '0188',
			new: '058',
		},
	]

	let result = arr.find((item) => phone.indexOf(item.old) === 0)
	return result ? `${result.new}${phone.substring(result.old.length)}` : phone
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
		name: Joi.string()
			.regex(/^[a-zA-Z ]{2,30}$/)
			.required()
			.messages({
				'string.empty': `Tên không được bỏ trống`,
				'string.pattern.base': `Tên không hợp lệ`,
				'any.required': `Tên không được bỏ trống`,
			}),
		phone: Joi.string()
			.regex(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Số điện thoại không được bỏ trống`,
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
	changePasswordUserSchema: Joi.object().keys({
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
	updatePriceSchema: Joi.object().keys({
		name: Joi.string(),
		status: Joi.boolean(),
	}),
	verifyOTP: Joi.object().keys({
		otp: Joi.string()
			.regex(/^[0-9]{6}$/)
			.required(),
	}),
	typeBankSchema: Joi.object().keys({
		param: Joi.string().valid('vcb', 'mbb', 'tpb', 'acb', 'tcb', 'vtb', 'momo', 'zalopay').required(),
	}),
	typeWalletSchema: Joi.object().keys({
		param: Joi.string().valid('momo', 'zalopay').required(),
	}),
	updateTelegramSchema: Joi.object().keys({
		username: Joi.string()
			.regex(/^[0-9a-zA-Z_-]+$/)
			.required(),
	}),
	newNotificationSchema: Joi.object().keys({
		title: Joi.string().required(),
		content: Joi.string().required(),
	}),
	notificationOptionalSchema: Joi.object().keys({
		status: Joi.boolean().required(),
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
	idBodySchema: Joi.object().keys({
		_id: Joi.string()
			.regex(/^[0-9a-zA-Z]{24}$/)
			.required(),
	}),
	checkTranferWeb: Joi.object().keys({
		_id: Joi.string()
			.regex(/^[0-9a-zA-Z]{24}$/)
			.required(),
		numberPhone: Joi.string()
			.regex(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Thiếu email gửi lên`,
			}),
	}),
	tranferDataWeb: Joi.object().keys({
		_id: Joi.string()
			.regex(/^[0-9a-zA-Z]{24}$/)
			.required(),
		numberPhone: Joi.string()
			.regex(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
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
		otp: Joi.string().regex(/^[0-9]{6}$/),
		NAME: Joi.string().required(),
	}),
	tranferData: Joi.object().keys({
		token: Joi.string()
			.guid({
				version: ['uuidv4'],
			})
			.required(),
		numberPhone: Joi.string()
			.regex(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
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
			.regex(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Thiếu Số điện thoại gửi lên`,
			}),
	}),
	confirmOTPWallet: Joi.object().keys({
		phone: Joi.string()
			.regex(/([\+84|84|0]+(3|5|7|8|9|1[2|6|8|9]))+([0-9]{8})\b/)
			.required()
			.messages({
				'string.empty': `Số điện thoại không được bỏ trống`,
				'string.pattern.base': `Số điện thoại không hợp lệ`,
				'any.required': `Thiếu email gửi lên`,
			}),
		otp: Joi.string()
			.regex(/^[0-9]{4,6}$/)
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

	blanceBankSchema: Joi.object().keys({
		token: Joi.string()
			.guid({
				version: ['uuidv4'],
			})
			.required(),
		password: Joi.string().min(6).required(),
	}),
	transactionBankSchema: Joi.object().keys({
		token: Joi.string()
			.guid({
				version: ['uuidv4'],
			})
			.required(),
		password: Joi.string().min(6).required(),
		accountNumber: Joi.string().required(),
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
	converterPhoneNumber,
}

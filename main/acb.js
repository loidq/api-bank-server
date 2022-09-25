const crypto = require('crypto')
const axios = require('axios')
const { newError, uuidv4, md5 } = require('../helpers/routerHelpers')
const dayjs = require('../config/day')
const Bank = require('../models/Bank')
const { svg2png } = require('svg-png-converter')
const qs = require('qs')
const NodeRSA = require('node-rsa')
const config = {
	publicKey:
		'-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDLenQHmHpaqYX4IrRVM8H1uB21\nxWuY+clsvn79pMUYR2KwIEfeHcnZFFshjDs3D2ae4KprjkOFZPYzEWzakg2nOIUV\nWO+Q6RlAU1+1fxgTvEXi4z7yi+n0Zs0puOycrm8i67jsQfHi+HgdMxCaKzHvbECr\n+JWnLxnEl6615hEeMQIDAQAB\n-----END PUBLIC KEY-----',

	public:
		'-----BEGIN RSA PUBLIC KEY-----\r\nMIIBCgKCAQEAtJrooyqaW0uaHUrBcsolAr+O9RRu/BdUp1N2Rcb7b58w1TMGqMGM\r\n2dyHzIIEwsPP1XwYf5Qo3oTkDGB8HD4FgTQOHydponYirfoZ0kGLCitz8CPv2dzg\r\nimbScm3sBKLNjHL6Y5yiJ4um/Pz0XUWF1LuEeI4ChDxHDjok+trSW/PiWIFW0P6v\r\nqEWwch3Hpv75/f0zB1lmKxuwmjo08JwR+y596UdnU/n2ZwjgyJ53yoXqn6i9aKsh\r\naJiDHflgRndxmXRf5TfcZzpz33UltIb02PclNozw7lyROMr9IBqH4Vr06afZgmgs\r\nrbz0L3VEryLdNW6JUyf0ZH+KUhvL4bAmWQIDAQAB\r\n-----END RSA PUBLIC KEY-----\r\n',
	private:
		'-----BEGIN RSA PRIVATE KEY-----\r\nMIIEowIBAAKCAQEAtJrooyqaW0uaHUrBcsolAr+O9RRu/BdUp1N2Rcb7b58w1TMG\r\nqMGM2dyHzIIEwsPP1XwYf5Qo3oTkDGB8HD4FgTQOHydponYirfoZ0kGLCitz8CPv\r\n2dzgimbScm3sBKLNjHL6Y5yiJ4um/Pz0XUWF1LuEeI4ChDxHDjok+trSW/PiWIFW\r\n0P6vqEWwch3Hpv75/f0zB1lmKxuwmjo08JwR+y596UdnU/n2ZwjgyJ53yoXqn6i9\r\naKshaJiDHflgRndxmXRf5TfcZzpz33UltIb02PclNozw7lyROMr9IBqH4Vr06afZ\r\ngmgsrbz0L3VEryLdNW6JUyf0ZH+KUhvL4bAmWQIDAQABAoIBADqe7VPIyEFJ0MQh\r\nN5kis9CojKZP85YvnHKTTJhpdcNNUHRjE45DBIzSX+GpchIlrJgGp40BciKHz92U\r\nk7Q3DWJamxrRmB/7aFZAD5GHZLHwWLlhcMCuSNOjfDtYInt+vGkSCOO8O4XKdnE3\r\nSbncjwv1sZHPxlFVn1qm1Mn3rL/bZcnZBpHATp+pItXRK4wFZzUeqeXztdnsKH4o\r\nJQo79cp98J0JOxfbFzYvlo/1XuOpnlGykfrcNqt5ZCOmNt1/mb5eFPCZq16+sAMG\r\nsCErx+V0A0AR1oj6/KCzbz8cSNw7MnJQex/8sQl96UidoRBdZ16FK5luMf/tVWmN\r\nH9EjPAECgYEA2nksozuirpg2Iwy7L0eh9r2ap1uanYyd6NEGh9e8tIWnwbXWMixG\r\ne3J1kCe15mBbsf/251lHxKndsCE4Ag3KSUKeYCxKu72kIKa/oLs4mjxhpLhBzqfj\r\nYk9hp5Y3ouVkGft0nFkw1Rz8UUt8ir4ewpUoTTYe8jTWmvjYi0eVjokCgYEA06CS\r\nmjquH63cft7vPTtwzo7HpeYeJfCXXGjSNKBSamD5dbDFvLMhunuR6PGjKpQisBA7\r\nRnIwmyLbXtEdFu6PzWHQR15AEgX8+Jq8BzzxDIQtzah/bdGTNO7NXcms4i+duAMO\r\nlpi0+I/mDffRVDN3KHFVOn5ZdGSewvp+7XCSZVECgYAbdyZccw/VoT8VEvGpVPkQ\r\nmu+JYKPEcLwdW8HVbBLGIxNe7+w4rIZD2LTc5ZEhoDWG4CX7GadDGxPKo7J116P5\r\np81fS9ItXf73N99ZZpAMG9Eusxda0pJsdoxRVDo0WWBHP+x+B1xzPkyeL749dv9I\r\n+RVy933WdzwPiX83q00q+QKBgQCKfaJy28PnZ1fMjwfxAl0oT7fHkXhZS8FB8Dbf\r\nyaslgqC9rBk7C98eso8h6j/lNVwd7AFecIvuejklK6PlxejFdyVeDwfOw6xw5JH4\r\nCqGUl0uCMqpxq5yyHzS2E6zXuGF2ckmxs+16XHEo4uxSNfvcs44a4WSZDt/2qQc3\r\nS1wCgQKBgDNEcLbf6N6JUrfhqsQcXOV+2FM3pQ9MChaMCa4JWLjx5Bg68+eTXJ4x\r\nXr5CcJP5El6dy/Jm43Yq8b6VsKe+ttVwalvlY9/H9V8jgdsgd68hLWHrhX6axgHM\r\nFgVty49ujBslHahMLcJFNbEHaKiUMGXcnQakz9vcDkX2Fyz9YHBn\r\n-----END RSA PRIVATE KEY-----\r\n',
	key: '123456789012345678901234567890aa',
}

const statusError = {
	'Invalid Credentials': 'Tên truy cập hoặc mật khẩu không chính xác. Tài khoản sẽ bị khoá sau 5 lần thử không thành công',
}

const randomString = (length) => {
	var result = ''
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	var charactersLength = characters.length
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
	}
	return result
}

function isObject(obj) {
	return obj !== undefined && obj !== null && obj.constructor == Object
}
const saveError = async (str, url) => {}

const isJson = (str) => {
	if (!str)
		newError({
			message: 'Server ACB đang lỗi dữ liệu, vui lòng thử lại sau.',
			status: 400,
		})

	if (isObject(str)) {
		return str
	} else {
		try {
			return JSON.parse(str)
		} catch (e) {
			return str
		}
	}
}

const postAxios = async (url, data, headers, method = 'post') => {
	let response = await axios({
		method,
		url,
		data,
		headers: {
			...headers,
			'Content-Type': 'application/json',
		},
		validateStatus: () => true,
		timeout: 4000,
	})

	if (response.status != 200) {
		if (!headers._id) {
			newError({
				message: statusError[response.data.message],
				status: 400,
			})
		}
	}
	if (response.status == 401 && response.data.exp == 'token expired' && headers._id) {
		await Bank.findByIdAndUpdate(headers._id, {
			newLogin: true,
		})
		newError({
			status: 400,
			message: response.data.exp || response.data || 'Có lỗi trong quá trình xử lí, vui lòng thử lại sau',
		})
	}

	let responseDecrypt = isJson(response.data)
	// if (headers._id && responseDecrypt.errorCode == '96') {
	// 	await Bank.findByIdAndUpdate(headers._id, {
	// 		newLogin: true,
	// 	})
	// }
	if (headers._id && responseDecrypt.codeStatus != '200')
		newError({
			message: str.messageStatus || 'Có lỗi trong quá trình xử lý',
			status: 400,
		})

	return { response: responseDecrypt, headers: response.headers, status: response.status }
}

const Login = async (req, res, next) => {
	let { username, _id } = req.bank
	let { password } = req.value.body
	let data = {
		username,
		password,
		clientId: 'iuSuHYVufIUuNIREV0FB9EoLn9kHsDbm',
	}

	let { response, status } = await postAxios('https://apiapp.acb.com.vn/mb/auth/tokens', data, {
		_id: false,
	})

	let refresh_token = response.refreshToken
	let jwt_token = response.accessToken
	await Bank.findByIdAndUpdate(_id, {
		refresh_token,
		jwt_token,
		newLogin: false,
	})

	req.bank.refresh_token = refresh_token
	req.bank.jwt_token = jwt_token
	req.bank.newLogin = false
}

const GET_BALANCE = async (req, res, next) => {
	let { newLogin, _id } = req.bank

	if (newLogin) await Login(req, res, next)

	let { response, status } = await postAxios(
		'https://apiapp.acb.com.vn/mb/legacy/ss/cs/bankservice/transfers/list/account-payment',
		'',
		{
			_id,
			Authorization: `Bearer ${req.bank.jwt_token}`,
		},
		'get'
	)

	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: response.data,
	})
}

const GET_TRANSACTION = async (req, res, next) => {
	let { accountNumber } = req.value.body
	let { newLogin, _id } = req.bank

	if (newLogin) await Login(req, res, next)

	let dayNow = new Date()

	let toDate = dayjs(dayNow).valueOf()

	let fromDate = dayjs(dayNow.setDate(dayNow.getDate() - 3))
		.hour(0)
		.minute(0)
		.second(0)
		.millisecond(0)
		.valueOf()

	//`https://apiapp.acb.com.vn/mb/legacy/ss/cs/bankservice/saving/${accountNumber}/tx-history?account=${accountNumber}&transactionType=ALL&from=${fromDate}&to=${toDate}&min=0&max=9007199254740991&page=1&size=100`,
	//		`https://apiapp.acb.com.vn/mb/legacy/ss/cs/bankservice/saving/tx-history?account=${accountNumber}&transactionType=ALL&from=${fromDate}&min=0&max=9007199254740991&page=1&size=100`,

	let { response, headers } = await postAxios(
		`https://apiapp.acb.com.vn/mb/legacy/ss/cs/bankservice/saving/tx-history?account=${accountNumber}&transactionType=ALL&from=${fromDate}&min=0&max=9007199254740991&page=1&size=100`,
		'',
		{
			Authorization: `Bearer ${req.bank.jwt_token}`,
			_id,
		},
		'get'
	)
	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: response.data,
	})
}

module.exports = {
	GET_BALANCE,
	GET_TRANSACTION,
}

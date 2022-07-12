const crypto = require('crypto')
const axios = require('axios')
const { newError, uuidv4, md5 } = require('../helpers/routerHelpers')
const dayjs = require('dayjs')
const Bank = require('../models/Bank')
const Error = require('../models/Error')
const imageToBase64 = require('image-to-base64')
const config = {
	publicKey:
		'-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAiEPragkOAc+PM2TqG1Xqh/+mqWP0dJge+VfJ/H75nwCchOMNG297SgRKx7M3\nrvwxUfTw602rZ1LiwLV+h16/tGj5BxuQCkfAj+QFp3P4A+Kar8spo1mW2i7MCshhtzF72SHJ\n9K1yH67RmrCZdHpYdezs5yb1FtccUkUUhpbTX9PBaKMhxmecJE1jORRiSCdRl+c54NHVAbxf\nGrDDMRFw3PFv9cCmLSvP8/7mI3ClmDz+e9PsxFDItaynaMogrJDOm3D4i3CF2YgVmGBNBWfy\na/0t88eCWfM34JJ87ufQuzi6Fs9n3XOeWXN8DNc02YD9/Ua7lKFxaFF9iQfZkB3ckwIDAQAB\n-----END RSA PUBLIC KEY-----',
	public:
		'-----BEGIN RSA PUBLIC KEY-----\r\nMIIBCgKCAQEAtJrooyqaW0uaHUrBcsolAr+O9RRu/BdUp1N2Rcb7b58w1TMGqMGM\r\n2dyHzIIEwsPP1XwYf5Qo3oTkDGB8HD4FgTQOHydponYirfoZ0kGLCitz8CPv2dzg\r\nimbScm3sBKLNjHL6Y5yiJ4um/Pz0XUWF1LuEeI4ChDxHDjok+trSW/PiWIFW0P6v\r\nqEWwch3Hpv75/f0zB1lmKxuwmjo08JwR+y596UdnU/n2ZwjgyJ53yoXqn6i9aKsh\r\naJiDHflgRndxmXRf5TfcZzpz33UltIb02PclNozw7lyROMr9IBqH4Vr06afZgmgs\r\nrbz0L3VEryLdNW6JUyf0ZH+KUhvL4bAmWQIDAQAB\r\n-----END RSA PUBLIC KEY-----\r\n',
	private:
		'-----BEGIN RSA PRIVATE KEY-----\r\nMIIEowIBAAKCAQEAtJrooyqaW0uaHUrBcsolAr+O9RRu/BdUp1N2Rcb7b58w1TMG\r\nqMGM2dyHzIIEwsPP1XwYf5Qo3oTkDGB8HD4FgTQOHydponYirfoZ0kGLCitz8CPv\r\n2dzgimbScm3sBKLNjHL6Y5yiJ4um/Pz0XUWF1LuEeI4ChDxHDjok+trSW/PiWIFW\r\n0P6vqEWwch3Hpv75/f0zB1lmKxuwmjo08JwR+y596UdnU/n2ZwjgyJ53yoXqn6i9\r\naKshaJiDHflgRndxmXRf5TfcZzpz33UltIb02PclNozw7lyROMr9IBqH4Vr06afZ\r\ngmgsrbz0L3VEryLdNW6JUyf0ZH+KUhvL4bAmWQIDAQABAoIBADqe7VPIyEFJ0MQh\r\nN5kis9CojKZP85YvnHKTTJhpdcNNUHRjE45DBIzSX+GpchIlrJgGp40BciKHz92U\r\nk7Q3DWJamxrRmB/7aFZAD5GHZLHwWLlhcMCuSNOjfDtYInt+vGkSCOO8O4XKdnE3\r\nSbncjwv1sZHPxlFVn1qm1Mn3rL/bZcnZBpHATp+pItXRK4wFZzUeqeXztdnsKH4o\r\nJQo79cp98J0JOxfbFzYvlo/1XuOpnlGykfrcNqt5ZCOmNt1/mb5eFPCZq16+sAMG\r\nsCErx+V0A0AR1oj6/KCzbz8cSNw7MnJQex/8sQl96UidoRBdZ16FK5luMf/tVWmN\r\nH9EjPAECgYEA2nksozuirpg2Iwy7L0eh9r2ap1uanYyd6NEGh9e8tIWnwbXWMixG\r\ne3J1kCe15mBbsf/251lHxKndsCE4Ag3KSUKeYCxKu72kIKa/oLs4mjxhpLhBzqfj\r\nYk9hp5Y3ouVkGft0nFkw1Rz8UUt8ir4ewpUoTTYe8jTWmvjYi0eVjokCgYEA06CS\r\nmjquH63cft7vPTtwzo7HpeYeJfCXXGjSNKBSamD5dbDFvLMhunuR6PGjKpQisBA7\r\nRnIwmyLbXtEdFu6PzWHQR15AEgX8+Jq8BzzxDIQtzah/bdGTNO7NXcms4i+duAMO\r\nlpi0+I/mDffRVDN3KHFVOn5ZdGSewvp+7XCSZVECgYAbdyZccw/VoT8VEvGpVPkQ\r\nmu+JYKPEcLwdW8HVbBLGIxNe7+w4rIZD2LTc5ZEhoDWG4CX7GadDGxPKo7J116P5\r\np81fS9ItXf73N99ZZpAMG9Eusxda0pJsdoxRVDo0WWBHP+x+B1xzPkyeL749dv9I\r\n+RVy933WdzwPiX83q00q+QKBgQCKfaJy28PnZ1fMjwfxAl0oT7fHkXhZS8FB8Dbf\r\nyaslgqC9rBk7C98eso8h6j/lNVwd7AFecIvuejklK6PlxejFdyVeDwfOw6xw5JH4\r\nCqGUl0uCMqpxq5yyHzS2E6zXuGF2ckmxs+16XHEo4uxSNfvcs44a4WSZDt/2qQc3\r\nS1wCgQKBgDNEcLbf6N6JUrfhqsQcXOV+2FM3pQ9MChaMCa4JWLjx5Bg68+eTXJ4x\r\nXr5CcJP5El6dy/Jm43Yq8b6VsKe+ttVwalvlY9/H9V8jgdsgd68hLWHrhX6axgHM\r\nFgVty49ujBslHahMLcJFNbEHaKiUMGXcnQakz9vcDkX2Fyz9YHBn\r\n-----END RSA PRIVATE KEY-----\r\n',
	key: '123456789012345678901234567890aa',
}

const statusError = {
	GW283: 'Mã captcha không chính xác. Vui lòng thử lại.',
	GW21: 'Thông tin đăng nhập không hợp lệ',
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

const refNo = () => dayjs().format('YYYYMMDDHHmmssSSS').substr(0, 16)

const encryptAES = (body, key) => {
	let iv = Buffer.alloc(0),
		cipher = crypto.createCipheriv('aes-256-ecb', key, null)
	return cipher.update(JSON.stringify(body), 'utf8', 'base64') + cipher.final('base64')
}

const decryptAES = (body, key) => {
	let iv = Buffer.alloc(32),
		cipher = crypto.createDecipheriv('aes-192-ecb', Buffer.from(key, 'base64'), null)

	return cipher.update(body, 'base64', 'utf8') + cipher.final('utf8')
}

const encryptRSA = (body) => {
	return crypto.publicEncrypt({ key: config.publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(body)).toString('base64')
}

const decryptRSA = (body) => {
	return crypto.privateDecrypt({ key: config.private, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(body, 'base64')).toString('utf8')
}

const encryptData = (body) => {
	let keyEncrypt = encryptRSA(Buffer.from(config.key).toString('base64'))

	let dataEncrypt = encryptAES(body, config.key)
	return keyEncrypt + '@@@@@@' + dataEncrypt
}

const decryptData = (body) => {
	let keyDecrypt = decryptRSA(body.substring(0, 344))

	let dataDecypt = decryptAES(body.substring(344), keyDecrypt)

	return JSON.parse(dataDecypt)
}

function isObject(obj) {
	return obj !== undefined && obj !== null && obj.constructor == Object
}
const saveError = async (str, url) => {
	if (!str.result.ok) {
		let error = new Error({
			data: str,
			status: str.result.responseCode,
		})
		await error.save()
		newError({
			message: str.result.message || 'Có lỗi trong quá trình xử lý',
			status: 400,
		})
	}
}

const isJson = (str) => {
	if (!str)
		newError({
			message: 'Server MBBank đang lỗi dữ liệu, vui lòng thử lại sau.',
			status: 400,
		})

	if (isObject(str)) {
		return str
	} else {
		console.log(str)
		return str
	}
}

const postAxios = async (url, data, headers) => {
	let response = await axios.post(url, data, {
		headers: {
			...headers,
			'Content-Type': 'application/json',
			Authorization: 'Basic QURNSU46QURNSU4=',
		},
		validateStatus: () => true,
		timeout: 5000,
	})
	if (response.status != 200 || !response.data.result.ok) {
		let error = new Error({
			url,
			data: response.data,
			status: response.status,
		})
		await error.save()
	}
	if (!response.data.result.ok) {
		// if (
		// 	headers._id &&
		// 	(response.data.code == '108' || response.data.code == 'EXP' || response.data.code == 'KICKOUT' || response.data.code == 'Unauthorized')
		// ) {
		// 	await Bank.findByIdAndUpdate(headers._id, {
		// 		newLogin: true,
		// 	})
		// }
		newError({
			message: response.data.result.message,
			status: 400,
		})
	}

	let responseDecrypt = isJson(response.data)
	// if (
	// 	headers._id &&
	// 	(responseDecrypt.code == '108' || responseDecrypt.code == 'EXP' || responseDecrypt.code == 'KICKOUT' || responseDecrypt.code == 'Unauthorized')
	// ) {
	// 	await Bank.findByIdAndUpdate(headers._id, {
	// 		newLogin: true,
	// 	})
	// }

	await saveError(responseDecrypt, url)
	return responseDecrypt
}

const Login = async (req, res, next) => {
	let { username, _id } = req.bank
	let { password } = req.value.body
	let { irefNo, imei, resultCaptcha } = await captcha()
	let data = {
		refNo: `${username}-${irefNo}`,
		userId: username,
		password: md5(password),
		captcha: resultCaptcha,
		sessionId: null,
		deviceIdCommon: imei,
	}

	let { response } = await postAxios('https://online.mbbank.com.vn/retail_web/internetbanking/doLogin', data, {
		_id: false,
	})

	let sessionId = response.sessionId

	await Bank.findByIdAndUpdate(_id, {
		sessionId,
		accountNumber: Object.keys(response.cust.acct_list)[0],
		newLogin: false,
	})
	req.bank.sessionId = sessionId
	req.bank.newLogin = false
}

const GET_BALANCE = async (req, res, next) => {
	let { jwt_token, cookies, username, newLogin, _id } = req.bank
	if (newLogin) await Login(req, res, next)
	let data = {
		user_name: username,
		data: {
			processCode: 'laydanhsachtaikhoan',
			cif: '',
			sessionId: '',
			type: 1,
			lang: 'vi',
		},
		client_key: config.public,
		lang: 'vi',
	}

	let { response, headers } = await postAxios(
		'https://vcbdigibank.vietcombank.com.vn/w1/process-ib',
		{
			data: encryptData(data),
			mid: 'laydanhsachtaikhoan',
		},
		{
			Authorization: `Bearer ${req.bank.jwt_token}`,
			Cookie: req.bank.cookies,
			_id,
		}
	)

	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: response.DDAccounts,
	})
}

const GET_TRANSACTION = async (req, res, next) => {
	let { accountNumber } = req.value.body
	let { username, jwt_token, cookies, newLogin, _id } = req.bank

	if (newLogin) await Login(req, res, next)

	let dayNow = new Date()
	let toDate = dayjs(dayNow).format('DD/MM/YYYY')
	let fromDate = dayjs(dayNow.setDate(dayNow.getDate() - 3)).format('DD/MM/YYYY')
	let data = {
		user_name: username,
		data: {
			processCode: 'laysaoketaikhoan',
			cif: '',
			sessionId: '',
			accountNo: accountNumber,
			accountType: 'D',
			fromDate,
			toDate,
			pageIndex: 0,
			lengthInPage: 999999,
			stmtDate: '',
			stmtType: '',
			lang: 'vi',
		},
		client_key: config.public,
		lang: 'vi',
	}
	let { response, headers } = await postAxios(
		'https://vcbdigibank.vietcombank.com.vn/w1/process-ib',
		{
			data: encryptData(data),
			mid: 'laysaoketaikhoan',
		},
		{
			Authorization: `Bearer ${req.bank.jwt_token}`,
			Cookie: req.bank.cookies,
			_id,
		}
	)
	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: response.transactions,
	})
}

const captcha = async () => {
	let irefNo = refNo()
	let imei = `${randomString(8)}-mbib-0000-0000-${irefNo}`
	let { data, status: statusCode } = await axios.post(
		'https://online.mbbank.com.vn/retail-web-internetbankingms/getCaptchaImage',
		{
			refNo: irefNo,
			deviceIdCommon: imei,
			sessionId: '',
		},
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Basic QURNSU46QURNSU4=',
			},
			validateStatus: () => true,
			timeout: 1500,
		}
	)

	if (statusCode != 200) {
		console.log('captcha mbb1 ', data)
		newError({
			status: 400,
			message: data || 'Capcha MBBank đang gặp vấn đề, vui lòng thử lại sau.',
		})
	}
	if (!data.result.ok) {
		console.log('captcha mbb2 ', data)
		newError({
			status: 400,
			message: data.result.message || 'Capcha MBBank đang gặp vấn đề, vui lòng thử lại sau.',
		})
	}

	let { data: resultCaptcha } = await axios.post('http://103.154.100.194:5000/mbb', data.imageString, {
		validateStatus: () => true,
		timeout: 2000,
	})
	resultCaptcha = `${resultCaptcha}`
	if (resultCaptcha.length != 6)
		newError({
			message: 'Server Captcha đang có vấn đề vui lòng thử lại sau.',
			status: 500,
		})

	return { irefNo, imei, resultCaptcha }
}

module.exports = {
	Login,
	GET_BALANCE,
	GET_TRANSACTION,
}

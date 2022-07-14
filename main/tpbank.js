const crypto = require('crypto')
const axios = require('axios')
const { newError, uuidv4, md5 } = require('../helpers/routerHelpers')
const dayjs = require('dayjs')
const Bank = require('../models/Bank')
const Error = require('../models/Error')
const HttpsProxyAgent = require('https-proxy-agent')
const Proxy = require('../models/Proxy')
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

const getProxy = async () => {
	let { host, port, auth } = await Proxy.findById('62d04051bdd86d759ccc4161')
	let proxy = new HttpsProxyAgent({
		host,
		port,
		auth,
	})
	return proxy
}

const saveError = async (str, url) => {
	if (str.error == true) {
		let error = new Error({
			data: str,
			status: str.errorCode,
		})
		await error.save()
		newError({
			message: str.errorMessage || 'Có lỗi trong quá trình xử lý',
			status: 400,
		})
	}
}

const isJson = (str) => {
	if (!str)
		newError({
			message: 'Server VietinBank đang lỗi dữ liệu, vui lòng thử lại sau.',
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

const postAxios = async (url, data, headers, proxy = null) => {
	let response = await axios.post(url, data, {
		headers: {
			...headers,
			'Content-Type': 'application/json',
		},
		httpsAgent: proxy,
		validateStatus: () => true,
		timeout: 4000,
	})

	if (response.status != 200) {
		let error = new Error({
			url,
			data: response.data,
			status: response.status,
		})
		await error.save()
	}

	if (response.data.error == true) {
		// if (headers._id && response.data.errorCode == '96') {
		// 	await Bank.findByIdAndUpdate(headers._id, {
		// 		newLogin: true,
		// 	})
		// }
		newError({
			status: 400,
			message: response.data.errorMessage || response.data,
		})
	}

	// let responseDecrypt = isJson(response.data)
	// if (headers._id && responseDecrypt.errorCode == '96') {
	// 	await Bank.findByIdAndUpdate(headers._id, {
	// 		newLogin: true,
	// 	})
	// }

	// await saveError(responseDecrypt, url)

	return { response: response.data, headers: response.headers, status: response.status }
}

const Login = async (req, res, next) => {
	let proxy = await getProxy()
	let deviceId = uuidv4()
	let { username, _id, imei } = req.bank
	let { password } = req.value.body
	let data = {
		password: password,
		deviceId: imei || deviceId,
		step_2FA: 'VERIFY',
		username: username,
	}

	let { response, status } = await postAxios(
		'https://ebank.tpb.vn/gateway/api/auth/login',
		data,
		{
			_id: false,
		},
		proxy
	)
	return res.status(status).json(response)

	let sessionId = response.sessionId

	await Bank.findByIdAndUpdate(_id, {
		sessionId,
		newLogin: false,
	})

	req.bank.sessionId = sessionId
	req.bank.newLogin = false
}

const GET_BALANCE = async (req, res, next) => {
	let { newLogin, _id } = req.bank
	if (newLogin) await Login(req, res, next)
	let data = {
		sessionId: req.bank.sessionId,
		lang: 'vi',
		requestId: `${randomString(12).toUpperCase()}|${new Date().getTime()}`,
	}
	let { response, headers } = await postAxios(
		'https://api-ipay.vietinbank.vn/ipay/wa/getEntitiesAndAccounts',
		{ encrypted: encryptData(data) },
		{
			_id,
		}
	)

	response.accounts.forEach(function (v) {
		delete v.accountState.serviceLimits
	})
	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: response.accounts,
	})
}

const GET_TRANSACTION = async (req, res, next) => {
	let { accountNumber } = req.value.body
	let { newLogin, _id } = req.bank

	if (newLogin) await Login(req, res, next)

	let dayNow = new Date()
	let toDate = dayjs(dayNow).format('YYYY-MM-DD')
	let fromDate = dayjs(dayNow.setDate(dayNow.getDate() - 3)).format('YYYY-MM-DD')
	let data = {
		accountNumber,
		startDate: fromDate,
		endDate: toDate,
		tranType: '',
		maxResult: '999999999',
		pageNumber: 0,
		searchKey: '',
		searchFromAmt: '',
		searchToAmt: '',
		lang: 'vi',
		requestId: `${randomString(12).toUpperCase()}|${new Date().getTime()}`,
		sessionId: req.bank.sessionId,
	}
	let { response, headers } = await postAxios(
		'https://api-ipay.vietinbank.vn/ipay/wa/getHistTransactions',
		{ encrypted: encryptData(data) },
		{
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
	let captchaId = randomString(9)

	let imgBase64 = await axios.get(`https://api-ipay.vietinbank.vn/api/get-captcha/${captchaId}`, {
		validateStatus: () => true,
		timeout: 2000,
		responseType: 'arraybuffer',
	})
	if (imgBase64.status != 200)
		newError({
			status: 400,
			message: 'Capcha VietinBank đang gặp vấn đề, vui lòng thử lại sau.',
		})
	let png = await svg2png({
		input: imgBase64.data,
		encoding: 'base64',
		format: 'png',
	})

	let { data: resultCaptcha, status } = await axios.post('http://103.154.100.194:5000/vtb', png, {
		validateStatus: () => true,
		timeout: 2000,
	})

	resultCaptcha = `${resultCaptcha}`
	if (status != 200 || resultCaptcha.length != 6)
		newError({
			message: 'Server Captcha đang có vấn đề vui lòng thử lại sau.',
			status: 500,
		})
	return { captchaId, resultCaptcha }
}

module.exports = {
	Login,
	GET_BALANCE,
	GET_TRANSACTION,
}

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

const statusError = {
	50525: 'Tên đăng nhập hoặc mật khẩu không đúng. Quý khách vui lòng thử lại.',
	50775:
		'Tài khoản tạm khóa do nhập sai thông tin đăng nhập quá 5 lần. Quý khách vui lòng tới điểm giao dịch/Livebank gần nhất hoặc liên hệ tổng đài 1900 585 885 để được hỗ trợ.',
	50514: 'Tài khoản của Quý khách cần bổ sung thông tin. Vui lòng sử dụng app TPBank Mobile để đăng nhập và hoàn thiện thông tin',
	50002: 'Thông tin đăng nhập không thể để trống.',
	50054: 'Mã Captcha không đúng. Quý khách vui lòng nhập lại.',
	50061: 'Mật khẩu đã hết hiệu lực. Vui lòng tới điểm giao dịch/LiveBank gần nhất hoặc liên hệ 1900 585 885 hoặc 1900 6036 để được hỗ trợ.',
	40118: 'Tạm khóa đăng nhập trên thiết bị mới. Quý khách vui lòng gọi tới tổng đài 1900 585 885 để được hỗ trợ.',
	txt_common_error: 'Đã có lỗi xảy ra. Quý khách vui lòng thử lại hoặc liên hệ 1900 585 885 để được hỗ trợ.',
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
	if (str.error) {
		let error = new Error({
			data: str,
			status: str.errorCode,
		})
		await error.save()
		newError({
			message: str.message || 'Có lỗi trong quá trình xử lý',
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

const postAxios = async (url, data, headers, proxy = null, method = 'post') => {
	let response = await axios({
		method,
		url,
		data,
		headers: {
			...headers,
		},
		httpsAgent: proxy,
		validateStatus: () => true,
		timeout: 4000,
	})
	if (response.status == 407)
		newError({
			message: 'Server Proxy có vấn đề, vui lòng thử lại sau',
			status: 407,
		})

	if (response.status != 200) {
		let error = new Error({
			url,
			data: response.data,
			status: response.status,
		})
		await error.save()
		if (headers._id && response.status == 401) {
			await Bank.findByIdAndUpdate(headers._id, {
				newLogin: true,
			})
			newError({
				status: 400,
				message: response.data,
			})
		}
	}

	if (response.data.error) {
		if (headers._id && response.data.error == 'Unauthorized') {
			await Bank.findByIdAndUpdate(headers._id, {
				newLogin: true,
			})
		}

		newError({
			status: 400,
			message: statusError[response.data.error.error_code] || response.data.error.error_message || response.data.message,
		})
	}

	let responseDecrypt = isJson(response.data)

	if (headers._id && responseDecrypt.error == 'Unauthorized') {
		await Bank.findByIdAndUpdate(headers._id, {
			newLogin: true,
		})
	}
	await saveError(responseDecrypt, url)

	return { response: responseDecrypt, headers: response.headers, status: response.status }
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

	let { response, status, headers } = await postAxios(
		'https://ebank.tpb.vn/gateway/api/auth/login',
		data,
		{
			_id: false,
			'Content-Type': 'application/json',
		},
		proxy
	)

	let cookies = headers['set-cookie']
	let jwt_token = response.access_token
	await Bank.findByIdAndUpdate(_id, {
		cookies,
		jwt_token,
		newLogin: false,
		imei: imei || deviceId,
	})
	req.bank.cookies = cookies
	req.bank.jwt_token = jwt_token
	req.bank.newLogin = false
	req.bank.imei = imei || deviceId
}

const GET_BALANCE = async (req, res, next) => {
	let proxy = await getProxy()
	let { newLogin, _id } = req.bank
	if (newLogin) await Login(req, res, next)

	let { response } = await postAxios(
		'https://ebank.tpb.vn/gateway/api/common-presentation-service/v1/bank-accounts',
		'',
		{
			_id,
			Authorization: `Bearer ${req.bank.jwt_token}`,
			Cookie: req.bank.cookies,
		},
		proxy,
		'get'
	)

	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: response,
	})
}

const GET_TRANSACTION = async (req, res, next) => {
	let proxy = await getProxy()
	let { accountNumber } = req.value.body
	let { newLogin, _id } = req.bank

	if (newLogin) await Login(req, res, next)

	let dayNow = new Date()
	let toDate = dayjs(dayNow).format('YYYYMMDD')
	let fromDate = dayjs(dayNow.setDate(dayNow.getDate() - 7)).format('YYYYMMDD')
	let data = {
		toDate,
		fromDate,
		currency: 'VND',
		accountNo: accountNumber,
	}
	let { response } = await postAxios(
		'https://ebank.tpb.vn/gateway/api/smart-search-presentation-service/v1/account-transactions/find',
		data,
		{
			_id,
			Authorization: `Bearer ${req.bank.jwt_token}`,
			Cookie: req.bank.cookies,
			'Content-Type': 'application/json',
		},
		proxy
	)
	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: response.transactionInfos,
	})
}

module.exports = {
	Login,
	GET_BALANCE,
	GET_TRANSACTION,
}

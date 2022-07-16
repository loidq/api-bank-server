const Bank = require('../models/Bank')
const axios = require('axios')
const crypto = require('crypto')
const Error = require('../models/Error')
const dayjs = require('dayjs')
const { uuidv4, sha256, newError } = require('../helpers/routerHelpers')
const Transaction = require('../models/Transaction')
//const { queueBrowseZaloPay } = require('./queue')
const config = {
	publicKey:
		'-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5x9DdnbbJxnMwbwFrRUs\nmKyPbR0/bCTavHnoWoqgvnyjcZM+aOXEkfZE+78oBn0A3p2T7aBgaKTczuq09xMj\n8qF6dlMT+70/DdF5/7V03xfglmHab+7QBsIf5IamEfy/c3U4W2znDamiEWKpa2Xt\nqfknFUX54Z0GiI6LuNV1LAOzxUOsycRBZbhvvG29DjWFeINZjD52I1rB7NMB+yqC\nhJWc6AVLQ/+aNSGb3zgnPsaA8K9M4cWSiVFOnQqgrKmtcSZirUdiErR475Fmi9U6\nn2iu/0Ytf3E+FBDJc9ZaEqYvHGGAfXJsZdg3YzFrS1j9G0QQTsSdUgFpWcZrhSpA\ngwIDAQAB\n-----END PUBLIC KEY-----',
}

const encryptRSA = (body) => {
	return crypto
		.publicEncrypt(
			{
				key: config.publicKey,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
				oaepHash: 'sha256',
			},
			Buffer.from(body)
		)
		.toString('base64')
}

function isObject(obj) {
	return obj !== undefined && obj !== null && obj.constructor == Object
}

const isJson = (str) => {
	if (!str)
		newError({
			message: 'Server ZaloPay đang lỗi dữ liệu, vui lòng thử lại sau.',
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
	let response = await axios({ method, url, data, headers, validateStatus: () => true, httpsAgent: proxy, timeout: 5000 })

	if (response.status != 200) {
		let error = new Error({
			url,
			data: response.data,
			status: response.status,
		})
		await error.save()
	}
	let responseData = isJson(response.data)

	if (headers._id && responseData.error && (responseData.error.code == 16 || responseData.error.error == 'Unauthenticated')) {
		await Bank.findByIdAndUpdate(headers._id, {
			status: 3,
		})
		newError({
			message: 'Phiên bản đã hết hạn, vui lòng đăng nhập lại.',
			status: 401,
		})
	}
	if (responseData.error)
		newError({
			message:
				(responseData.error.details && responseData.error.details.localized_message.message) ||
				responseData.error.error ||
				'Có lỗi trong quá trình xử lí, vui lòng thử lại sau hoặc báo admin kiểm tra.',
			status: 400,
		})

	return responseData
}

const postAxios2 = async (url, headers) => {
	let response = await axios.get(url, { headers, validateStatus: () => true, timeout: 2000 })

	if (response.status != 200 || response.data.error) return {}
	return response.data.data
}

const checkPhoneNumber = async (req, res, next) => {
	let { phone } = req.value.body

	let response = await postAxios(
		`https://api.zalopay.vn/v2/account/phone/status?phone_number=${phone}`,
		'',
		{
			'x-device-id': req.bank.imei,
		},
		null,
		'get'
	)

	if (!response.data.has_phone)
		newError({
			message: 'Số điện thoại chưa đăng ký sử dụng ZaloPay.',
			status: 400,
		})

	if (response.data.is_locked)
		newError({
			message: 'Tài khoản ZaloPay này đang bị tạm khoá.',
			status: 400,
		})
	let send_otp_token = response.data.send_otp_token
	req.bank.send_otp_token = send_otp_token

	next()
}

const SEND_OTP_ZALOPAY = async (req, res, next) => {
	let { phone } = req.value.body
	let data = {
		send_otp_token: req.bank.send_otp_token,
		phone_number: phone,
	}
	await postAxios('https://api.zalopay.vn/v2/account/otp', data, {
		'x-device-id': req.bank.imei,
		'Content-Type': 'application/json',
	})
	next()
}

const CONFIRM_OTP_ZALOPAY = async (req, res, next) => {
	if (!req.bank) req.bank = {}
	let { otp, _id } = req.value.body
	let check = await Bank.findById(_id)
	if (!check)
		newError({
			status: 400,
			message: 'Có lỗi trong quá trình xử lí, vui lòng thử lại sau.',
		})
	req.bank = check
	let { phone, imei } = req.bank
	let data = {
		phone_number: phone,
		otp,
	}

	let response = await postAxios('https://api.zalopay.vn/v2/account/otp-verification', data, {
		'x-device-id': imei,
		'Content-Type': 'application/json',
	})
	req.bank.phone_verified_token = response.data.phone_verified_token
	next()
}

const GET_SALT = async (req, res, next) => {
	let { imei } = req.bank
	let response = await postAxios('https://api.zalopay.vn/v2/user/salt', '', { 'x-device-id': imei }, null, 'get')
	req.bank.salt = response.data.salt
	next()
}

const LOGIN = async (req, res, next) => {
	let { imei, phone, phone_verified_token, _id } = req.bank
	let { password } = req.value.body
	let data = {
		phone_verified_token,
		pin: encryptRSA(JSON.stringify({ pin: sha256(password), salt: req.bank.salt })),
		phone_number: phone,
	}
	let response = await postAxios('https://api.zalopay.vn/v2/account/phone/session', data, {
		'x-device-id': imei,
		'Content-Type': 'application/json',
	})
	let jwt_token = response.data.session_id
	let access_token = response.data.access_token
	await Bank.findByIdAndUpdate(_id, {
		jwt_token,
		access_token,
		status: 1,
		password,
	})
	req.bank.jwt_token = jwt_token
	req.bank.access_token = access_token
	req.bank.password = password
	next()
}

const GET_BALANCE = async (req, res, next) => {
	let { jwt_token, imei, _id } = req.bank
	let response = await postAxios(
		'https://api.zalopay.vn/v2/user/balance',
		'',
		{
			'x-device-id': imei,
			Authorization: `Bearer ${jwt_token}`,
			_id: _id,
		},
		null,
		'get'
	)
	await Bank.findByIdAndUpdate(_id, {
		balance: response.data.balance,
	})
	req.bank.balance = response.data.balance
	next()
}

const browse = async (bank) => {
	let { jwt_token } = bank
	if (!bank.page_token) bank.page_token = ''
	let startDate = dayjs(new Date().setDate(1)).hour(0).minute(0).second(0).millisecond(0).valueOf()
	let endDate = dayjs(new Date()).valueOf()
	let fromDate = bank.newLogin ? startDate : dayjs(new Date().setHours(new Date().getHours() - 1)).valueOf()
	let toDate = endDate.valueOf()

	let data = await postAxios2(`https://sapi.zalopay.vn/v2/history/transactions?page_size=20&page_token=${bank.page_token}`, {
		Authorization: `Bearer ${jwt_token}`,
	})

	if (!data.transactions) return
	let transactions = data.transactions
	transactions.map(async (item) => {
		if (
			(item.category_id == 5 || item.category_id == 2) &&
			dayjs(item.trans_time).valueOf() <= toDate &&
			dayjs(item.trans_time).valueOf() >= fromDate &&
			item.status_info.status == 1
		) {
			let check = await Transaction.findOne({
				bank: 'zalopay',
				banks: bank._id,
				transId: item.trans_id,
			})
			if (!check) {
				let transaction = new Transaction({
					bank: 'zalopay',
					owner: bank.owner,
					banks: bank._id,
					io: item.sign,
					serviceId: item.system_type,
					transId: item.trans_id,
					amount: item.trans_amount,
					time: item.trans_time,
				})
				await transaction.save()
			}
		}
	})
	if (Boolean(data.next_page_token) && dayjs(transactions.pop().trans_time).valueOf() >= fromDate) {
		bank.page_token = data.next_page_token
		await queueBrowseZaloPay.add(bank, {
			delay: 500,
			removeOnComplete: true,
			removeOnFail: true,
			timeout: 3000,
		})
	} else if (bank.newLogin)
		await Bank.findByIdAndUpdate(bank._id, {
			newLogin: false,
		})
}

const details = async (bank) => {
	let response = await postAxios2(`https://sapi.zalopay.vn/v2/history/transactions/${bank.transId}?type=${bank.serviceId}`, {
		Authorization: `Bearer ${bank.banks.jwt_token}`,
	})
	if (!response.transaction) return
	let data = response.transaction
	let comment = data.description
	await Transaction.findByIdAndUpdate(bank._id, {
		status: true,
		info: data.template_info.custom_fields,
		comment,
		postBalance: data.balance_snapshot,
	})
}

module.exports = {
	checkPhoneNumber,
	SEND_OTP_ZALOPAY,
	LOGIN,
	CONFIRM_OTP_ZALOPAY,
	GET_SALT,
	postAxios2,
	GET_BALANCE,
	browse,
	details,
}

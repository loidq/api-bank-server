const crypto = require('crypto')
const axios = require('axios')
const Error = require('../models/Error')
const { newError } = require('../helpers/routerHelpers')
const config = {
	appVer: process.env.appVer,
	appCode: process.env.appCode,
	rkey: '01234567890123456789',
	requestkey: 'lfn/7dxBuD0pJw+hfAgtMTxR7TZ2xIJAVP+CacyLq0f/HFjXTJtT0mZNzWmMAxATCeF9W3hBJMNE/PqXGaR5yQ==',
	ENCRYPT_KEY:
		'-----BEGIN RSA PUBLIC KEY-----\r\nMEgCQQDjtTNZJnbMWXON/mhhLzENzQW8TOH/gaOZ72u6FEzfjyWSfGsP6/rMIVjY\r\n2w44ZyqNG2p45PGmp3Y8bquPAQGnAgMBAAE=\r\n-----END RSA PUBLIC KEY-----\r\n',
}

const encryptAES = (body, key) => {
	let iv = Buffer.alloc(16),
		cipher = crypto.createCipheriv('aes-256-cbc', key.substring(0, 32), iv),
		part1 = cipher.update(body, 'utf8'),
		part2 = cipher.final()
	return Buffer.concat([part1, part2]).toString('base64')
}

const decryptAES = (body, key) => {
	let iv = Buffer.alloc(16),
		cipher = crypto.createDecipheriv('aes-256-cbc', key.substring(0, 32), iv)
	return cipher.update(body, 'base64') + cipher.final('utf8')
}

const encryptRSA = (body) => {
	return crypto.publicEncrypt({ key: config.ENCRYPT_KEY, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(body)).toString('base64')
}

const generateCheckSum = (data, type, times) => {
	let checkSumSyntax = `${data.phone}${times}000000${type}${times / 1000000000000.0}E12`
	return encryptAES(checkSumSyntax, data.setupKey)
}

const getProxy = async () => {
	let { host, port } = await Proxy.findById(ID_PROXY)
	let proxy = new HttpsProxyAgent({
		host,
		port,
	})
	return proxy
}

const get_ip_address = async () => {
	let { data: response, status } = await axios.get('https://api.ipify.org?format=json')
	if (status != 200) return '127.0.0.1'
	return response.ip
}

const saveError = async (str) => {
	if (str.result === false || str.errorCode != 0) {
		let error = new Error({
			data: str.errorDesc || '',
			status: str.errorCode,
		})
		await error.save()
	}
}

const isJson = async (str) => {
	if (!str)
		newError({
			message: 'Server Momo loi du lieu, vui long thu lai sau',
			status: 400,
		})
	try {
		JSON.parse(str)
		await saveError(str)
		return str
	} catch (e) {
		let response = decryptAES(str, '123456789012345678901234567890aa')
		await saveError(response)
		return response
	}
}

const postAxios = async (url, data, headers, proxy = null) => {
	let response = await axios.post(url, data, {
		headers,
		validateStatus: () => true,
		httpsAgent: proxy,
	})
	if (response.status != 200) {
		let error = new Error({
			url,
			data: response.data,
			status: response.status,
		})
		await error.save()
	}
	return isJson(response.data)
}

const CHECK_USER_BE_MSG = async (req, res, next) => {
	let { phone } = req.value.body
	let { imei } = req.bank
	let time = new Date().getTime()
	let data = {
		user: phone,
		msgType: 'CHECK_USER_BE_MSG',
		cmdId: time + '000000',
		lang: 'vi',
		time,
		channel: 'APP',
		appVer: config.appVer,
		appCode: config.appCode,
		deviceOS: 'IOS',
		buildNumber: 0,
		appId: 'vn.momo.platform',
		result: true,
		errorCode: 0,
		errorDesc: '',
		momoMsg: {
			_class: 'mservice.backend.entity.msg.RegDeviceMsg',
			number: phone,
			imei,
			cname: 'Vietnam',
			ccode: '084',
			device: 'iPhone 12',
			firmware: '15.0',
			hardware: 'iPhone',
			manufacture: 'Apple',
			csp: 'Viettel',
			icc: '',
			mcc: '452',
			mnc: '04',
			device_os: 'IOS',
		},
		extra: {
			checkSum: '',
		},
	}
	let response = await postAxios('https://api.momo.vn/backend/auth-app/public/CHECK_USER_BE_MSG', data, {
		msgtype: 'CHECK_USER_BE_MSG',
		accept: 'application/json',
		'Content-Type': 'application/json',
	})
	if (response.result === false) newError({ status: 400, message: response.errorDesc })
	next()
}

const SEND_OTP_MSG = async (req, res, next) => {
	let { phone } = req.value.body
	let { imei } = req.bank
	let time = new Date().getTime()
	let data = {
		user: phone,
		msgType: 'SEND_OTP_MSG',
		cmdId: time + '000000',
		lang: 'vi',
		time,
		channel: 'APP',
		appVer: config.appVer,
		appCode: config.appCode,
		deviceOS: 'IOS',
		buildNumber: 0,
		appId: 'vn.momo.platform',
		result: true,
		errorCode: 0,
		errorDesc: '',
		momoMsg: {
			_class: 'mservice.backend.entity.msg.RegDeviceMsg',
			number: phone,
			imei,
			cname: 'Vietnam',
			ccode: '084',
			device: 'iPhone 12',
			firmware: '15.0',
			hardware: 'iPhone',
			manufacture: 'Apple',
			csp: 'Viettel',
			icc: '',
			mcc: '452',
			mnc: '04',
			device_os: 'IOS',
		},
		extra: {
			action: 'SEND',
			rkey: config.rkey,
			AAID: '',
			IDFA: '',
			TOKEN: '',
			SIMULATOR: 'false',
			isVoice: false,
			REQUIRE_HASH_STRING_OTP: true,
			MODELID: imei,
			DEVICE_TOKEN: '',
			checkSum: '',
		},
	}
	let response = await postAxios('https://api.momo.vn/backend/otp-app/public/SEND_OTP_MSG', data, {
		msgtype: 'SEND_OTP_MSG',
		accept: 'application/json',
		'Content-Type': 'application/json',
	})
	if (!response.result) newError({ message: response.errorDesc, status: 400 })
	next()
}

const REG_DEVICE_MSG = async (req, res, next) => {
	let { otp, password } = req.value.body
	let { phone, imei, _id } = req.bank
	let time = new Date().getTime(),
		data = {
			user: phone,
			msgType: 'REG_DEVICE_MSG',
			cmdId: time + '000000',
			lang: 'vi',
			time: time,
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.platform',
			result: true,
			errorCode: 0,
			errorDesc: '',
			momoMsg: {
				_class: 'mservice.backend.entity.msg.RegDeviceMsg',
				number: phone,
				imei,
				cname: 'Vietnam',
				ccode: '084',
				device: 'iPhone 12',
				firmware: '15.0',
				hardware: 'iPhone',
				manufacture: 'Apple',
				csp: 'Viettel',
				icc: '',
				mcc: '452',
				mnc: '04',
				device_os: 'IOS',
			},
			extra: {
				ohash: sha256(phone + config.rkey + otp),
				AAID: '',
				IDFA: '',
				TOKEN: '',
				SIMULATOR: 'false',
			},
		}
	let response = await postAxios('https://api.momo.vn/backend/otp-app/public/REG_DEVICE_MSG', data, {
		Msgtype: 'REG_DEVICE_MSG',
		Accept: 'application/json',
		'Content-Type': 'application/json',
		Userhash: md5(phone),
	})
	if (!response.result) newError({ message: response.errorDesc, status: 400 })
	req.bank.setupKey = decryptAES(response.extra.setupKey, response.extra.ohash)
	req.bank.phash = encryptAES(`${imei}|${password}`, setupKey)
	req.bank.password = password
	await Bank.findByIdAndUpdate(_id, {
		setupKey: req.bank.setupKey,
		phash: req.bank.phash,
		otp,
		password,
	})
	next()
}

const UN_REG_DEVICE_MSG = async (req, res, next) => {
	let { password, phone, _id } = req.bank
	let time = new Date().getTime()
	let checkSum = generateCheckSum(req.bank, 'UN_REG_DEVICE_MSG', time)
	let data = {
		user: phone,
		pass: password,
		msgType: 'UN_REG_DEVICE_MSG',
		cmdId: time + '000000',
		lang: 'vi',
		time,
		channel: 'APP',
		appVer: config.appVer,
		appCode: config.appCode,
		deviceOS: 'IOS',
		buildNumber: 0,
		appId: 'vn.momo.platform',
		result: true,
		errorCode: 0,
		errorDesc: '',
		momoMsg: {
			_class: 'mservice.backend.entity.msg.UnRegDeviceMsg',
			imHash: 'todo imHash',
		},
		extra: {
			checkSum,
		},
	}
	let response = await postAxios('https://api.momo.vn/backend/auth-app/public/UN_REG_DEVICE_MSG', data, {
		msgtype: 'UN_REG_DEVICE_MSG',
	})
	if (!response.result) {
		await Bank.findByIdAndUpdate(_id, {
			status: 3,
		})
		newError({
			message: response.errorDesc,
			status: 400,
		})
	}
	next()
}

const USER_LOGIN_MSG = async (req, res, next) => {
	let { password, phone, phash, _id } = req.bank
	let time = new Date().getTime()
	let checkSum = generateCheckSum(req.bank, 'USER_LOGIN_MSG', time)
	let data = {
		user: phone,
		pass: password,
		msgType: 'USER_LOGIN_MSG',
		cmdId: time + '000000',
		lang: 'vi',
		time,
		channel: 'APP',
		appVer: config.appVer,
		appCode: config.appCode,
		deviceOS: 'IOS',
		buildNumber: 0,
		appId: 'vn.momo.platform',
		result: true,
		errorCode: 0,
		errorDesc: '',
		momoMsg: {
			_class: 'mservice.backend.entity.msg.LoginMsg',
			isSetup: true,
		},
		extra: {
			checkSum,
			pHash: phash,
			AAID: '',
			IDFA: '',
			TOKEN: '',
			SIMULATOR: 'false',
		},
	}
	let response = await postAxios('https://owa.momo.vn/public/login', data, {
		msgtype: 'USER_LOGIN_MSG',
		Accept: 'application/json',
		'Content-Type': 'application/json',
		Userhash: md5(phone),
	})
	if (!response.result) {
		if (response.errorCode == -83)
			await Bank.findByIdAndUpdate(_id, {
				status: 3,
			})
		newError({
			message: response.errorDesc,
			status: 400,
		})
	} else {
		req.bank.jwt_token = response.extra.AUTH_TOKEN
		req.bank.refresh_token = response.extra.REFRESH_TOKEN
		await Bank.findByIdAndUpdate(_id, {
			jwt_token: response.extra.AUTH_TOKEN,
			refresh_token: response.extra.REFRESH_TOKEN,
			lastLogin: new Date(),
			balance: response.extra.BALANCE,
		})
	}
	next()
}

const SOF_LIST_MANAGER_MSG = async (req, res, next) => {
	let { jwt_token, phone, _id } = req.bank
	let time = new Date().getTime(),
		checkSum = generateCheckSum(req.bank, 'SOF_LIST_MANAGER_MSG', time)
	let data = encryptAES(
		JSON.stringify({
			user: phone,
			msgType: 'SOF_LIST_MANAGER_MSG',
			cmdId: time + '000000',
			lang: 'vi',
			time,
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.platform',
			result: true,
			errorCode: 0,
			errorDesc: '',
			momoMsg: {
				_class: 'mservice.backend.entity.msg.ForwardMsg',
			},
			extra: {
				checkSum,
			},
		}),
		'123456789012345678901234567890aa'
	)
	let response = await postAxios('https://owa.momo.vn/api/SOF_LIST_MANAGER_MSG', data, {
		msgtype: 'SOF_LIST_MANAGER_MSG',
		userid: phone,
		requestkey: config.requestkey,
		Authorization: `Bearer ${jwt_token}`,
	})
	if (!response.result)
		newError({
			message: response.errorDesc,
			status: 400,
		})
	await Bank.findByIdAndUpdate(_id, {
		balance: response.momoMsg.sofInfo[0].balance,
	})
	req.bank.balance = response.momoMsg.sofInfo[0].balance
	next()
}

const FIND_RECEIVER_PROFILE = async (req, res, next) => {
	let { phone, jwt_token } = req.bank
	let { numberPhone: targetUserId } = req.value.body
	let time = new Date().getTime(),
		checkSum = generateCheckSum(req.bank, 'FIND_RECEIVER_PROFILE', time)
	let data = await encryptAES(
		JSON.stringify({
			user: phone,
			msgType: 'FIND_RECEIVER_PROFILE',
			cmdId: `${time}000000`,
			lang: 'vi',
			time,
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.transfer',
			result: true,
			errorCode: 0,
			errorDesc: '',
			momoMsg: {
				callerId: 'FE_transfer_p2p',
				targetUserId,
				_class: 'mservice.backend.entity.msg.ForwardMsg',
			},
			extra: {
				checkSum,
			},
		}),
		'123456789012345678901234567890aa'
	)

	let response = await postAxios('https://owa.momo.vn/api/FIND_RECEIVER_PROFILE', data, {
		userid: phone,
		requestkey: config.requestkey,
		Authorization: `Bearer ${jwt_token}`,
	})
	if (!response.result) newError({ message: response.errorDesc, status: 400 })
	if (!response.momoMsg.receiverProfile)
		newError({
			message: 'Số điện thoại không tồn tại',
			status: 400,
		})
	return response.momoMsg.receiverProfile.name
}

const CHECK_USER_PRIVATE = async (req, res, next) => {
	let { numberPhone: CHECK_INFO_NUMBER } = req.value.body
	let { phone, jwt_token } = req.bank
	let time = new Date().getTime(),
		checkSum = generateCheckSum(req.bank, 'CHECK_USER_PRIVATE', time)
	let data = encryptAES(
		JSON.stringify({
			user: phone,
			msgType: 'CHECK_USER_PRIVATE',
			cmdId: `${time}000000`,
			lang: 'vi',
			time,
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.transfer',
			result: true,
			errorCode: 0,
			errorDesc: '',
			momoMsg: {
				_class: 'mservice.backend.entity.msg.LoginMsg',
				getMutualFriend: false,
			},
			extra: {
				CHECK_INFO_NUMBER,
				checkSum,
			},
		}),
		'123456789012345678901234567890aa'
	)

	let response = await postAxios('https://owa.momo.vn/api/CHECK_USER_PRIVATE', data, {
		userid: phone,
		requestkey: config.requestkey,
		Authorization: `Bearer ${jwt_token}`,
	})
	if (!response.result)
		newError({
			message: response.errorDesc || 'So dien thoai chua dang ky Vi MoMo',
			status: 400,
		})
	if (!req.info) {
		req.info.NAME = response.extra.NAME
		req.info.NAME_KYC = response.extra.NAME_KYC
	}
	next()
}

const M2M_VALIDATE_MSG = async (currentAccount, partnerId, message = null) => {
	let { phone, jwt_token } = currentAccount
	let key = randomkey(32),
		requestkey = encryptRSA(key)
	let time = new Date().getTime(),
		checkSum = await generateCheckSum(currentAccount, 'M2M_VALIDATE_MSG', time)
	let data = await encryptAES(
		JSON.stringify({
			user: phone,
			msgType: 'M2M_VALIDATE_MSG',
			cmdId: `${time}000000`,
			lang: 'vi',
			time,
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.transfer',
			result: true,
			errorCode: 0,
			errorDesc: '',
			momoMsg: {
				partnerId,
				_class: 'mservice.backend.entity.msg.ForwardMsg',
				message,
			},
			extra: {
				CHECK_INFO_NUMBER,
				checkSum,
			},
		}),
		key
	)

	var { data: response } = await postAxios('https://owa.momo.vn/api/M2M_VALIDATE_MSG', data, {
		userid: phone,
		requestkey: requestkey,
		Authorization: `Bearer ${jwt_token}`,
	})

	response = JSON.parse(await decryptAES(response, key))

	if (!response.result) newError({ message: response.errorDesc || 'Có lỗi trong quá trình xử lí', status: 400 })
	if (!response)
		newError({
			message: 'Đã xảy ra lỗi ở momo hoặc bạn đã hết hạn truy cập vui lòng đăng nhập lại',
			status: 400,
		})
	return response.momoMsg.message
}

const M2MU_INIT = async (req, res, next) => {
	let ip = await get_ip_address()
	let { phone, jwt_token } = req.bank
	let { NAME: partnerName } = req.info
	let { numberPhone: partnerId, amount, comment } = req.value.body
	let time = new Date().getTime()
	let checkSum = generateCheckSum(req.bank, 'M2MU_INIT', time)
	let data = await encryptAES(
		JSON.stringify({
			user: phone,
			msgType: 'M2MU_INIT',
			cmdId: time + '000000',
			lang: 'vi',
			time,
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.platform',
			result: true,
			errorCode: 0,
			errorDesc: '',
			momoMsg: {
				clientTime: time - 221,
				tranType: 2018,
				comment,
				amount,
				partnerId,
				partnerName,
				ref: '',
				serviceCode: 'transfer_p2p',
				serviceId: 'transfer_p2p',
				_class: 'mservice.backend.entity.msg.M2MUInitMsg',
				tranList: [
					{
						partnerName,
						partnerId,
						originalAmount: amount,
						serviceCode: 'transfer_p2p',
						stickers: '',
						themeUrl: 'https://cdn.mservice.com.vn/app/img/transfer/theme/Corona_750x260.png',
						transferSource: '',
						socialUserId: '',
						chatId: '',
						receiverType: 1,
						_class: 'mservice.backend.entity.msg.M2MUInitMsg',
						tranType: 2018,
						comment,
						moneySource: 1,
						partnerCode: 'momo',
						serviceMode: 'transfer_p2p',
						serviceId: 'transfer_p2p',
						extras: `{"loanId":0,"appSendChat":false,"loanIds":[],"stickers":"","themeUrl":"https://cdn.mservice.com.vn/app/img/transfer/theme/Corona_750x260.png","vpc_CardType":"SML","vpc_TicketNo":"${ip}","vpc_PaymentGateway":""}`,
					},
				],
				extras: `{"loanId":0,"appSendChat":false,"loanIds":[],"stickers":"","themeUrl":"https://cdn.mservice.com.vn/app/img/transfer/theme/Corona_750x260.png","vpc_CardType":"SML","vpc_TicketNo":"${ip}","vpc_PaymentGateway":""}`,
				moneySource: 1,
				defaultMoneySource: 1,
				partnerCode: 'momo',
				rowCardId: '',
				giftId: '',
				useVoucher: 0,
				discountCode: null,
				prepaidIds: '',
				usePrepaid: 0,
			},
			extra: {
				checkSum,
			},
		}),
		'123456789012345678901234567890aa'
	)
	let response = await postAxios('https://owa.momo.vn/api/M2MU_INIT', data, {
		requestkey: config.requestkey,
		userid: phone,
		Authorization: `Bearer ${jwt_token}`,
	})
	if (!response.result) newError({ message: response.errorDesc, status: 400 })
	req.info.ID = response.momoMsg.replyMsgs[0].ID
	req.info.tranHisMsg = response.momoMsg.replyMsgs[0].tranHisMsg
	next()
}

const M2MU_CONFIRM = async (req, res, next) => {
	let { ID, tranHisMsg, NAME: partnerName } = req.info
	let { numberPhone: partnerId, amount, comment, password } = req.value.body
	let { phone, jwt_token, _id, owner } = req.bank
	let time = new Date().getTime(),
		checkSum = await generateCheckSum(req.bank, 'M2MU_CONFIRM', time)
	let data = await encryptAES(
		JSON.stringify({
			user: phone,
			msgType: 'M2MU_CONFIRM',
			pass: password,
			cmdId: time + '000000',
			lang: 'vi',
			time,
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.platform',
			result: true,
			errorCode: 0,
			errorDesc: '',
			momoMsg: {
				otpType: 'NA',
				ipAddress: 'N/A',
				enableOptions: {
					voucher: true,
					discount: true,
					prepaid: true,
					desc: '',
				},
				_class: 'mservice.backend.entity.msg.M2MUConfirmMsg',
				quantity: 1,
				idFirstReplyMsg: ID,
				moneySource: 1,
				cbAmount: 0,
				tranHisMsg,
				desc: 'Thành công',
				error: 0,
				tranType: 2018,
				ids: [ID],
				amount,
				originalAmount: amount,
				fee: 0,
				feeCashIn: 0,
				feeMoMo: 0,
				cashInAmount: amount,
				otp: '',
				extras: '{}',
			},
			extra: {
				checkSum,
			},
		}),
		'123456789012345678901234567890aa'
	)
	let response = await postAxios('https://owa.momo.vn/api/M2MU_CONFIRM', data, {
		requestkey: config.requestkey,
		userid: phone,
		Authorization: `Bearer ${jwt_token}`,
	})
	if (!response.result) newError({ message: response.errorDesc, status: 400 })
	let transaction = new Transaction({
		io: -1,
		time: response.momoMsg.replyMsgs[0].finishTime,
		tranId: response.momoMsg.replyMsgs[0].tranId,
		partnerId: response.momoMsg.replyMsgs[0].tranHisMsg.partnerId,
		partnerName: response.momoMsg.replyMsgs[0].tranHisMsg.partnerName,
		amount: response.momoMsg.replyMsgs[0].tranHisMsg.amount,
		postBalance: response.extra.BALANCE,
		banks: _id,
		owner,
	})
	await transaction.save()
	await Bank.findByIdAndUpdate(_id, {
		balance: response.extra.BALANCE,
	})
	req.info.transaction = {
		io: -1,
		time: response.momoMsg.replyMsgs[0].finishTime,
		tranId: response.momoMsg.replyMsgs[0].tranId,
		partnerId: response.momoMsg.replyMsgs[0].tranHisMsg.partnerId,
		partnerName: response.momoMsg.replyMsgs[0].tranHisMsg.partnerName,
		amount: response.momoMsg.replyMsgs[0].tranHisMsg.amount,
		postBalance: response.extra.BALANCE,
	}
	next()
}

const SEND_MONEY = async (currentAccount, dataTranfer) => {}

const GENERATE_TOKEN_AUTH_MSG = async (req, res, next) => {
	let { phone, refresh_token, imei, jwt_token, _id } = req.bank
	let time = new Date().getTime(),
		checkSum = generateCheckSum(req.bank, 'GENERATE_TOKEN_AUTH_MSG', time)
	let data = JSON.stringify({
		user: phone,
		msgType: 'GENERATE_TOKEN_AUTH_MSG',
		cmdId: time + '000000',
		lang: 'vi',
		time: time,
		channel: 'APP',
		appVer: config.appVer,
		appCode: config.appCode,
		deviceOS: 'IOS',
		buildNumber: 0,
		appId: 'vn.momo.platform',
		result: true,
		errorCode: 0,
		errorDesc: '',
		momoMsg: {
			_class: 'mservice.backend.entity.msg.RefreshTokenMsg',
			refreshToken: refresh_token,
		},
		extra: {
			AAID: '',
			IDFA: '',
			TOKEN: '',
			ONESIGNAL_TOKEN: '',
			SIMULATOR: 'false',
			MODELID: imei,
			DEVICE_TOKEN: '',
			checkSum,
		},
	})
	let response = await postAxios('https://api.momo.vn/backend/auth-app/public/GENERATE_TOKEN_AUTH_MSG', data, {
		userid: phone,
		Authorization: `Bearer ${jwt_token}`,
	})

	if (!response.result) {
		await USER_LOGIN_MSG(req, res, next)
		newError({
			message: response.errorDesc || `Lấy Authorization thất bại. [${response.errorCode}]`,
			status: 400,
		})
	} else
		await Bank.findByIdAndUpdate(_id, {
			jwt_token: response.extra.AUTH_TOKEN,
			lastLogin: new Date(),
		})
}

const transactionHistory = async (currentAccount) => {
	let time = new Date().getTime()
	let data = encryptAES(
		JSON.stringify({
			requestId: time,
			startDate: begin,
			endDate: end,
			offset,
			limit,
			lang: 'vi',
			channel: 'APP',
			appVer: config.appVer,
			appCode: config.appCode,
			deviceOS: 'IOS',
			buildNumber: 0,
			appId: 'vn.momo.transactionhistory',
		}),
		key
	)
	var { data: response } = await postAxios('https://api.momo.vn/sync/transhis/browse', data, {
		'Content-Type': 'application/json',
		requestkey: requestkey,
		Authorization: `Bearer ${jwt_token}`,
	})
	response = await decryptAES(response, key)

	if (!isJson(response)) newError({ message: response || 'Lỗi dữ liệu từ Server Momo', status: 500 })

	response = JSON.parse(response)
	if (response.resultCode != 0) newError({ message: response.message || 'Không thể lấy lịch sử giao dịch, vui lòng thử lại sau!!!', status: 400 })
	return response
}

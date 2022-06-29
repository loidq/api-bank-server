const crypto = require('crypto')
const axios = require('axios')
const config = {
	appVer: process.env.appVer,
	appCode: process.env.appCode,
	rkey: '01234567890123456789',
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
	console.log(config.ENCRYPT_KEY)
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

const isJson = (str) => {
	try {
		JSON.parse(str)
		return true
	} catch (e) {
		return false
	}
}

const postAxios = async (url, data, headers, proxy = null) => {
	return await axios.post(url, data, {
		headers,
		validateStatus: () => true,
		httpsAgent: proxy,
	})
}

const SEND_OTP_MSG = async (phone) => {
	let time = new Date().getTime(),
		imei = uuidv4(),
		data = {
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
	let { data: response } = await postAxios('https://api.momo.vn/backend/otp-app/public/SEND_OTP_MSG', data, {
		Msgtype: 'SEND_OTP_MSG',
		Accept: 'application/json',
		'Content-Type': 'application/json',
	})
	if (!response.result) newError({ message: res.errorDesc, status: 400 })
	return imei
}

const REG_DEVICE_MSG = async (currentAccount, inputData) => {
	let { phone, imei, _id } = currentAccount
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
				ohash: sha256(phone + config.rkey + inputData.otp),
				AAID: '',
				IDFA: '',
				TOKEN: '',
				SIMULATOR: 'false',
			},
		}
	let { data: response } = await postAxios('https://api.momo.vn/backend/otp-app/public/REG_DEVICE_MSG', data, {
		Msgtype: 'REG_DEVICE_MSG',
		Accept: 'application/json',
		'Content-Type': 'application/json',
		Userhash: md5(phone),
	})
	if (!response.result) newError({ message: response.errorDesc, status: 400 })
	let setupKey = await decryptAES(response.extra.setupKey, response.extra.ohash)
	let phash = await encryptAES(`${imei}|${inputData.password}`, setupKey)

	await USER_LOGIN_MSG({
		password: inputData.password,
		phone,
		phash,
		_id,
		setupKey,
	})
	await Bank.findByIdAndUpdate(_id, {
		setupKey,
		phash,
	})
}

const USER_LOGIN_MSG = async (currentAccount) => {
	let { password, phone, phash, _id } = currentAccount
	let time = new Date().getTime()
	let checkSum = generateCheckSum(currentAccount, 'USER_LOGIN_MSG', time)
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
		},
		{ data: response } = await postAxios('https://owa.momo.vn/public/login', data, {
			Msgtype: 'USER_LOGIN_MSG',
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Userhash: md5(phone),
		})
	if (!response.result) {
		await Bank.findByIdAndUpdate(_id, {
			status: 4,
			message: response.errorDesc || 'Hết thời gian truy cập vui lòng đăng nhập lại',
			errorCode: response.errorCode,
		})
		newError({
			status: 400,
			message: response.errorDesc || 'Phiên bản đã hết hạn, vui lòng đăng nhập lại',
		})
	}

	await Bank.findByIdAndUpdate(_id, {
		jwt_token: response.extra.AUTH_TOKEN,
		refresh_token: response.extra.REFRESH_TOKEN,
	})
}

const SOF_LIST_MANAGER_MSG = async (currentAccount) => {
	let { jwt_token, phone } = currentAccount
	let key = randomkey(32),
		requestkey = encryptRSA(key)
	let time = new Date().getTime(),
		checkSum = await generateCheckSum(currentAccount, 'SOF_LIST_MANAGER_MSG', time)
	var data = await encryptAES(
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
			key
		),
		{ data: response } = await postAxios('https://owa.momo.vn/api/SOF_LIST_MANAGER_MSG', data, {
			msgtype: 'SOF_LIST_MANAGER_MSG',
			userid: phone,
			requestkey,
			Authorization: `Bearer ${jwt_token}`,
		})
	response = JSON.parse(await decryptAES(response, key))
	if (!response.result)
		newError({
			message: response.errorDesc || 'Lấy số dư không thành công, vui lòng thử lại sau.',
			status: 400,
		})
	return { balance: response.momoMsg.sofInfo[0].balance } || {}
}

const FIND_RECEIVER_PROFILE = async (currentAccount, targetUserId) => {
	let { phone, jwt_token } = currentAccount
	let key = randomkey(32),
		requestkey = encryptRSA(key)
	let time = new Date().getTime(),
		checkSum = await generateCheckSum(currentAccount, 'FIND_RECEIVER_PROFILE', time)
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
		key
	)

	var { data: response } = await postAxios('https://owa.momo.vn/api/FIND_RECEIVER_PROFILE', data, {
		userid: phone,
		requestkey: requestkey,
		Authorization: `Bearer ${jwt_token}`,
	})

	response = JSON.parse(await decryptAES(response, key))

	if (!response.result) newError({ message: response.errorDesc || 'Có lỗi trong quá trình xử lí', status: 400 })
	if (!response.momoMsg.receiverProfile)
		newError({
			message: 'Số điện thoại không tồn tại',
			status: 400,
		})
	return response.momoMsg.receiverProfile.name
}

const CHECK_USER_PRIVATE = async (currentAccount, CHECK_INFO_NUMBER) => {
	let { phone, jwt_token } = currentAccount
	let key = randomkey(32),
		requestkey = encryptRSA(key)
	let time = new Date().getTime(),
		checkSum = await generateCheckSum(currentAccount, 'CHECK_USER_PRIVATE', time)
	let data = await encryptAES(
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
		key
	)

	var { data: response } = await postAxios('https://owa.momo.vn/api/CHECK_USER_PRIVATE', data, {
		userid: phone,
		requestkey: requestkey,
		Authorization: `Bearer ${jwt_token}`,
	})

	response = JSON.parse(await decryptAES(response, key))

	if (!response.result) newError({ message: response.errorDesc || 'Có lỗi trong quá trình xử lí', status: 400 })
	if (!response.extra)
		newError({
			message: 'Số điện thoại không tồn tại',
			status: 400,
		})
	return response.extra.NAME
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

const M2MU_INIT = async (currentAccount, dataTranfer) => {
	let ip = await get_ip_address()
	let { phone, jwt_token } = currentAccount
	let { partnerId, partnerName, amount, comment } = dataTranfer
	let key = randomkey(32),
		requestkey = encryptRSA(key),
		time = new Date().getTime()
	let checkSum = await generateCheckSum(currentAccount, 'M2MU_INIT', time)
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
		key
	)
	var { data: response } = await postAxios('https://owa.momo.vn/api/M2MU_INIT', data, {
		requestkey,
		userid: phone,
		Authorization: `Bearer ${jwt_token}`,
	})
	if (!response)
		newError({
			message: 'Lỗi cơ sở dữ liệu. Quý khách vui lòng thử lại sau',
			status: 400,
		})
	let response = JSON.parse(await decryptAES(response, key))

	if (!response.result) newError({ message: response.errorDesc || `lỗi chưa xác định: ${response.errorCode}`, status: 400 })

	return {
		ID: response.momoMsg.replyMsgs[0].ID,
		tranHisMsg: response.momoMsg.replyMsgs[0].tranHisMsg,
	}
}

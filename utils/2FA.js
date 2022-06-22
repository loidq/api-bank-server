const otplib = require('otplib')
const qrcode = require('qrcode')

const generateOTPToken = (email, domain, secret2FA) => otplib.authenticator.keyuri(email, domain, secret2FA)

const generateTempUniqueSecret = () => otplib.authenticator.generateSecret()

const generateOTPValue = (secret) => otplib.authenticator.generate(secret)

const verifyOTPToken = (otp, secret) =>
	otplib.authenticator.verify({
		token: otp,
		secret,
	})

const generateQRCode = async (input) => {
	return await qrcode.toDataURL(input)
}

module.exports = {
	generateOTPToken,
	generateOTPValue,
	generateTempUniqueSecret,
	verifyOTPToken,
	generateQRCode,
}

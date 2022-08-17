const nodemailer = require('nodemailer')

const mailSender = async (mailData) => {
	try {
		const transporter = await nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: 'pay247.one@gmail.com',
				pass: 'awbscjiqvhkfzvrv',
			},
		})
		const data = {
			from: 'pay247.one@gmail.com',
			to: mailData.emailTo,
			subject: '[THUEAPI.NET] TOKEN sử dụng api, vui lòng không chia sẻ cho bất kì ai, hãy cẩn thận kẻ gian!!!',
			html: `<h3>${mailData.message}</h3>`,
		}

		await transporter.sendMail(data)
	} catch (error) {
		console.log(error, 'Mail Error')
	}
}

module.exports = { mailSender }

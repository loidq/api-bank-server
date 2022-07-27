const Price = require('../models/Price')

const priceList = async (req, res, next) => {
	const result = await Promise.allSettled([Price.find({}, { _id: 0 }), Price.countDocuments({})])
	let list = result[0].status === 'fulfilled' ? result[0].value : []
	let total = result[1].status === 'fulfilled' ? result[1].value : 0

	return res.status(200).json({
		success: true,
		message: 'Thành công.',
		data: { list, total },
	})
}

const priceUpdate = async (req, res, next) => {
	let { idPrice } = req.value.params
	let dataUpdate = req.value.body

	await Price.findByIdAndUpdate(idPrice, dataUpdate)
	return res.status(200).json({
		success: true,
		message: 'Thành công.',
		data: {},
	})
}

module.exports = { priceList, priceUpdate }

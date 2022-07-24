const Recharge = require('../models/Recharge')

const { infoRecharge } = require('../config/main')
const { getRandomInt } = require('../helpers/routerHelpers')

const getSyntax = async (req, res, next) => {
	const { _id: userID } = req.user
	const Syntaxs = await Recharge.findOne(
		{
			owner: userID,
			status: false,
			createdAt: { $gte: new Date().setMinutes(new Date().getMinutes() - 30) },
		},
		{ _id: 0 }
	)

	if (!Syntaxs) {
		const newSyntaxs = new Recharge({
			syntax: getRandomInt(100000, 999999),
			owner: userID,
		})
		await newSyntaxs.save()
		return res.status(200).json({
			success: true,
			data: {
				...infoRecharge,
				syntax: newSyntaxs.syntax,
			},
		})
	}
	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: {
			...infoRecharge,
			syntax: Syntaxs.syntax,
		},
	})
}

const getHistory = async (req, res, next) => {
	const { _id } = req.user
	const histories = await Recharge.find(
		{
			owner: _id,
			status: true,
		},
		{ _id: 0, type: 1, amount: 1, syntax: 1, updatedAt: 1 }
	)
		.limit(5)
		.sort({
			updatedAt: -1,
		})
	return res.status(200).json({
		success: true,
		message: 'Thành công',
		data: histories,
	})
}

module.exports = { getSyntax, getHistory }

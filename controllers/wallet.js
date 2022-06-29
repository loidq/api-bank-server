const { newError, uuidv4 } = require('../helpers/routerHelpers')
const Bank = require('../models/Bank')
const Deck = require('../models/Deck')
const newWallet = async (req, res, next) => {
	const deck = req.deck
	const { _id } = req.user
	let { bank } = req.value.params
	let { username } = req.value.body
	if (await Bank.findOne({ bank, username }))
		newError({
			status: 400,
			message: 'Tài khoản này đã tồn tại trong hệ thống.',
		})

	const newBank = new Bank({ bank, username, owner: _id, token: uuidv4(), decks: deck._id })
	await newBank.save()
	// Add newly created bank to the actual banks

	await Deck.findByIdAndUpdate(deck._id, {
		banks: newBank._id,
	})
	return res.status(200).json({
		success: true,
		message: 'Bạn đã thêm tài khoản thành công.',
		data: {},
	})
}

module.exports = {
	deleteWallet,
	newBank,
	updateBank,
	listBank,
}

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TransactionSchema = new Schema(
	{
		io: {
			type: Number,
		},
		transId: {
			type: Number,
		},
		partnerId: {
			type: String,
		},
		partnerName: {
			type: String,
		},
		amount: {
			type: Number,
		},
		postBalance: {
			type: Number,
		},
		comment: {
			type: String,
		},
		time: {
			type: Date,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'Wallet',
		},
	},
	{ timestamps: true }
)

const Transaction = mongoose.model('Transaction', TransactionSchema)
module.exports = Transaction

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TransactionSchema = new Schema(
	{
		bank: {
			type: String,
			enum: ['momo', 'zalopay'],
			lowercase: true,
		},
		io: {
			type: Number,
		},
		serviceId: {
			type: String,
		},
		transId: {
			type: Number,
			index: true,
		},
		info: {
			type: Object,
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
		status: {
			type: Boolean,
			default: false,
		},
		banks: {
			type: Schema.Types.ObjectId,
			ref: 'Bank',
			index: true,
		},
		ip: {
			type: String,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
)

const Transaction = mongoose.model('Transaction', TransactionSchema)
module.exports = Transaction

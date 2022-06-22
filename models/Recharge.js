const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RechargeSchema = new Schema(
	{
		syntax: {
			type: Number,
		},
		url: {
			type: String,
		},
		amount: {
			type: Number,
		},
		type: {
			type: String,
		},
		status: {
			type: Boolean,
			default: false,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
)

const Recharge = mongoose.model('Recharge', RechargeSchema)
module.exports = Recharge

const mongoose = require('mongoose')
const Schema = mongoose.Schema
//expired
const PriceSchema = new Schema({
	type: {
		type: String,
		enum: ['momo', 'vcb', 'acb', 'mbb', 'zalopay', 'tpb', 'vtb', 'tcb'],
		lowercase: true,
	},
	name: {
		type: String,
	},
	amount: {
		type: Number,
	},
	status: {
		type: Boolean,
		default: true,
	},
})

const Price = mongoose.model('Price', PriceSchema)
module.exports = Price

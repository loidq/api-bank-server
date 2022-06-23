const mongoose = require('mongoose')
const Schema = mongoose.Schema
//expired
const PriceSchema = new Schema({
	type: {
		type: String,
		enum: ['momo', 'vcb', 'acb', 'mbb', 'zalopay', 'tpb', 'vtb', 'tcb'],
		lowercase: true,
	},
	amount: {
		type: Number,
	},
})

const Price = mongoose.model('Price', PriceSchema)
module.exports = Price

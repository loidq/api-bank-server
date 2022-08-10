const mongoose = require('mongoose')
const Schema = mongoose.Schema
//expired
const DeckSchema = new Schema(
	{
		type: {
			type: String,
			enum: ['momo', 'vcb', 'acb', 'mbb', 'zalopay', 'tpb', 'vtb', 'tcb'],
			lowercase: true,
		},
		name: {
			type: String,
		},
		expired: {
			type: Date,
		},
		banks: {
			type: Schema.Types.ObjectId,
			ref: 'Bank',
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
)

const Deck = mongoose.model('Deck', DeckSchema)
module.exports = Deck

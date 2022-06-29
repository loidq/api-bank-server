const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BankSchema = new Schema(
	{
		bank: {
			type: String,
			enum: ['vcb', 'mbb', 'tpb', 'acb', 'vtb', 'momo', 'zalopay'],
			lowercase: true,
			required: [true, "can't be blank"],
		},
		username: {
			type: String,
		},
		phone: {
			type: String,
		},
		password: {
			type: String,
		},
		otp: {
			type: String,
		},
		setupKey: {
			type: String,
		},
		phash: {
			type: String,
		},
		imei: {
			type: String,
		},
		refresh_token: {
			type: String,
		},
		access_token: {
			type: String,
		},
		sessionId: {
			type: String,
		},
		cookies: {
			type: Object,
		},
		jwt_token: {
			type: String,
		},
		token: {
			type: String,
		},
		balance: {
			type: Number,
			min: 0,
			default: 0,
		},
		status: {
			type: Number,
			enum: [0, 1, 2, 3, 4, 99],
			default: 1,
		},
		errorCode: {
			type: Number,
		},
		decks: {
			type: Schema.Types.ObjectId,
			ref: 'Deck',
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
)

const Bank = mongoose.model('Bank', BankSchema)
module.exports = Bank

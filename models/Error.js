const mongoose = require('mongoose')
const Schema = mongoose.Schema
//expired
const ErrorSchema = new Schema(
	{
		url: {
			type: String,
		},
		data: {
			type: Object,
		},
		status: {
			type: String,
		},
	},
	{ timestamps: true }
)

const Error = mongoose.model('Error', ErrorSchema)
module.exports = Error

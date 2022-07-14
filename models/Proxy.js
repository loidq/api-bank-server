const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProxySchema = new Schema(
	{
		host: {
			type: String,
		},
		port: {
			type: String,
		},
		auth: {
			type: String,
		},
	},
	{ timestamps: true }
)

const Proxy = mongoose.model('Proxy', ProxySchema)
module.exports = Proxy

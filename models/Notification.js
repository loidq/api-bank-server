const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NotificationSchema = new Schema(
	{
		title: {
			type: String,
			required: [true, "can't be blank"],
		},
		content: {
			type: String,
			required: [true, "can't be blank"],
		},
		status: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
)

const Notification = mongoose.model('Notification', NotificationSchema)
module.exports = Notification

const Notification = require('../models/Notification')

const deleteNotification = async (req, res, next) => {
	const { notificationID } = req.value.params

	const notification = await Notification.findById(notificationID)
	if (!notification)
		return res.status(400).json({
			success: false,
			error: {
				message: 'Thông báo cần xoá không tồn tại. Vui lòng tải lại trang',
			},
		})
	await notification.remove()
	return res.status(200).json({ success: true, message: 'Đã xoá thông báo thành công.' })
}

const getNotification = async (req, res, next) => {
	const notifications = await Notification.find({ status: true }, { title: 1, content: 1, createdAt: 1, _id: 1 })
	return res.status(200).json({ success: true, data: notifications })
}

const updateNotification = async (req, res, next) => {
	const { notificationID } = req.value.params
	const { status: status } = req.value.body
	const result = await Notification.findByIdAndUpdate(notificationID, { status })

	return res.status(200).json({ success: Boolean(result), data: {} })
}

const newNotification = async (req, res, next) => {
	const notification = req.value.body

	const newNotification = new Notification(notification)

	await newNotification.save()

	return res.status(201).json({ success: true })
}

module.exports = {
	deleteNotification,
	getNotification,
	updateNotification,
	newNotification,
}

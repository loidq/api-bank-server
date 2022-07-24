const router = require('express-promise-router')()
const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const NotificationController = require('../controllers/notification')

const { validateBody, validateParam, schemas } = require('../helpers/routerHelpers')

router
	.route('/')
	.get(passport.authenticate('jwt', { session: false }), NotificationController.getNotification)
	.post(passport.authenticate('jwt', { session: false }), validateBody(schemas.newNotificationSchema), NotificationController.newNotification)

router
	.route('/:notificationID')
	.patch(
		passport.authenticate('jwt', { session: false }),

		validateParam(schemas.idSchema, 'notificationID'),
		validateBody(schemas.notificationOptionalSchema),
		NotificationController.updateNotification
	)
	.delete(
		passport.authenticate('jwt', { session: false }),

		validateParam(schemas.idSchema, 'notificationID'),
		NotificationController.deleteNotification
	)

module.exports = router

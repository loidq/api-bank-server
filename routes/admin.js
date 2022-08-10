const router = require('express-promise-router')()

const Users = require('../controllers/admin/user')
const passport = require('passport')
const passportConfig = require('../middlewares/passport')
const { authPage } = require('../middlewares/basicAuth')

const { validateBody, validateParam, schemas } = require('../helpers/routerHelpers')

router.route('/users').get(passport.authenticate('jwt', { session: false }), authPage('admin'), Users.getAllUser)
router
	.route('/user/:id')
	.get(validateParam(schemas.idSchema, 'id'), passport.authenticate('jwt', { session: false }), authPage('admin'), Users.getUser)
	.patch(validateParam(schemas.idSchema, 'id'), passport.authenticate('jwt', { session: false }), authPage('admin'), Users.updateUser)
	.post(
		validateParam(schemas.idSchema, 'id'),
		validateBody(schemas.changePasswordUserSchema),
		passport.authenticate('jwt', { session: false }),
		authPage('admin'),
		Users.changePassword
	)
	.delete(
		validateParam(schemas.idSchema, 'id'),

		passport.authenticate('jwt', { session: false }),
		authPage('admin'),
		Users.deleteUser
	)

module.exports = router

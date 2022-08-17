const router = require('express-promise-router')()

const AuthController = require('../controllers/auth')

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const { validateBody, schemas } = require('../helpers/routerHelpers')

router.route('/register').post(validateBody(schemas.registerSchema), AuthController.register)

router.route('/login').post(
	validateBody(schemas.loginSchema),
	(req, res) => {
		console.log(req.value.body, req.body)
	},
	passport.authenticate('local', { session: false }),

	AuthController.login
)

router
	.route('/session')
	.get(passport.authenticate('jwt', { session: false }), AuthController.session)
	.delete(passport.authenticate('jwt', { session: false }), AuthController.forgetsession)

module.exports = router

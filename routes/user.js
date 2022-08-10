const express = require('express')
const router = require('express-promise-router')()

const UserController = require('../controllers/user')

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const { validateBody, schemas } = require('../helpers/routerHelpers')

router
	.route('/me')
	.get(passport.authenticate('jwt', { session: false }), UserController.getInfo)
	.post(passport.authenticate('jwt', { session: false }), validateBody(schemas.changePasswordSchema), UserController.changePassword)
	.patch(passport.authenticate('jwt', { session: false }), validateBody(schemas.updateTelegramSchema), UserController.updateTelegram)
	.delete(passport.authenticate('jwt', { session: false }), UserController.deleteUser)

module.exports = router

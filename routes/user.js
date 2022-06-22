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
/*
router
	.route('/decks')
	.get(passport.authenticate('jwt', { session: false }), UserController.getUserDecks)
	.post(passport.authenticate('jwt', { session: false }), validateBody(schemas.deckSchema), UserController.newUserDeck)
// .put(passport.authenticate('jwt', { session: false }),validateBody(schemas.userSchema),UserController.replaceUser)
*/

module.exports = router

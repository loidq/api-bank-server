const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const DeckController = require('../controllers/deck')
const { validateBody, validateParam, schemas, validateQuery } = require('../helpers/routerHelpers')

router.route('/list').get(passport.authenticate('jwt', { session: false }), DeckController.listDeck)

router.route('/upgrade').post(passport.authenticate('jwt', { session: false }), validateBody(schemas.upgradeSchema), DeckController.upgrade)

router
	.route('/:bankID')
	.post(
		passport.authenticate('jwt', { session: false }),
		validateParam(schemas.idSchema, 'bankID'),
		validateBody(schemas.extendSchema),
		DeckController.extend
	)
module.exports = router

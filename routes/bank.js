const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const BankController = require('../controllers/bank')
const DeckController = require('../controllers/deck')
const { validateBody, validateParam, schemas, validateQuery } = require('../helpers/routerHelpers')

router
	.route('/:bank')
	.get(passport.authenticate('jwt', { session: false }), validateParam(schemas.typeBankSchema, 'bank'), BankController.listBank)
	.post(
		passport.authenticate('jwt', { session: false }),
		validateParam(schemas.typeBankSchema, 'bank'),
		validateBody(schemas.newBankSchema),
		DeckController.checkExpired,
		BankController.newBank
	)
router
	.route('/:bankID')
	.patch(
		passport.authenticate('jwt', { session: false }),
		validateParam(schemas.idSchema, 'bankID'),
		validateBody(schemas.bankOptionalSchema),
		BankController.updateBank
	)
	.delete(passport.authenticate('jwt', { session: false }), validateParam(schemas.idSchema, 'bankID'), BankController.deleteBank)
module.exports = router

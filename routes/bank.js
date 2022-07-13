const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const BankController = require('../controllers/bank')
const DeckController = require('../controllers/deck')
const { validateBody, validateParam, schemas, validateQuery } = require('../helpers/routerHelpers')

const Vietcombank = require('../main/vietcombank')
const MBBank = require('../main/mbbank')
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

router
	.route('/:bank/login')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, MBBank.Login)
router
	.route('/:bank/getBalance')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, MBBank.GET_BALANCE)
router
	.route('/:bank/getTransaction')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.transactionBankSchema), DeckController.checkDate, MBBank.GET_TRANSACTION)

// router
// 	.route('/:bank/getBalance')
// 	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, Vietcombank.GET_BALANCE)

// router
// 	.route('/:bank/getTransaction')
// 	.get(
// 		validateParam(schemas.typeBankSchema, 'bank'),
// 		validateBody(schemas.transactionBankSchema),
// 		DeckController.checkDate,
// 		Vietcombank.GET_TRANSACTION
// 	)
module.exports = router

const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const BankController = require('../controllers/bank')
const DeckController = require('../controllers/deck')
const { validateBody, validateParam, schemas, validateQuery } = require('../helpers/routerHelpers')

const VietcomBank = require('../main/vietcombank')
const MBBank = require('../main/mbbank')
const VietinBank = require('../main/vietinbank')
const ACB = require('../main/acb')
const TPBank = require('../main/tpbank')

router.route('/lastTransaction').get(passport.authenticate('jwt', { session: false }), BankController.lastTransactionBank)

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

router.route('/:bank/transaction/:bankId').get(
	passport.authenticate('jwt', { session: false }),
	validateParam(schemas.typeWalletSchema, 'bank'),
	validateParam(schemas.idSchema, 'bankId'),
	// validateBody(schemas.idBodySchema),
	DeckController.checkDateIdBank,
	BankController.transactionBank
)

router
	.route('/:bank/login')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, TPBank.Login)
router
	.route('/:bank/getBalance')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, TPBank.GET_BALANCE)
router
	.route('/:bank/getTransaction')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.transactionBankSchema), DeckController.checkDate, TPBank.GET_TRANSACTION)

// router
// 	.route('/:bank/getBalance')
// 	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, VietcomBank.GET_BALANCE)

// router
// 	.route('/:bank/getTransaction')
// 	.get(
// 		validateParam(schemas.typeBankSchema, 'bank'),
// 		validateBody(schemas.transactionBankSchema),
// 		DeckController.checkDate,
// 		VietcomBank.GET_TRANSACTION
// 	)
module.exports = router

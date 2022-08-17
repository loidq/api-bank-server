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
const rateLimit = require('express-rate-limit')

const limiterSendMail = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 10,
	message: {
		success: false,
		error: {
			message: 'Bạn đã vượt quá số lần lấy token, vui lòng thử lại sau!',
		},
	},
	keyGenerator: (req, res) => {
		return req.clientIp // IP address from requestIp.mw(), as opposed to req.ip
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

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
	.route('/:bankID/token')
	.get(passport.authenticate('jwt', { session: false }), validateParam(schemas.idSchema, 'bankID'), limiterSendMail, BankController.sendTokenToMail)

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

// router
// 	.route('/:bank/login')
// 	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, TPBank.Login)
router
	.route('/:bank/getBalance')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.blanceBankSchema), DeckController.checkDate, (req, res, next) => {
		if (req.value.params.bank == 'vcb') return VietcomBank.GET_BALANCE(req, res, next)
		else if (req.value.params.bank == 'mbb') return MBBank.GET_BALANCE(req, res, next)
		else if (req.value.params.bank == 'vtb') return VietinBank.GET_BALANCE(req, res, next)
		else if (req.value.params.bank == 'acb') return ACB.GET_BALANCE(req, res, next)
		else if (req.value.params.bank == 'tpb') return TPBank.GET_BALANCE(req, res, next)
		else return next()
	})
router
	.route('/:bank/getTransaction')
	.get(validateParam(schemas.typeBankSchema, 'bank'), validateBody(schemas.transactionBankSchema), DeckController.checkDate, (req, res, next) => {
		if (req.value.params.bank == 'vcb') return VietcomBank.GET_TRANSACTION(req, res, next)
		else if (req.value.params.bank == 'mbb') return MBBank.GET_TRANSACTION(req, res, next)
		else if (req.value.params.bank == 'vtb') return VietinBank.GET_TRANSACTION(req, res, next)
		else if (req.value.params.bank == 'acb') return ACB.GET_TRANSACTION(req, res, next)
		else if (req.value.params.bank == 'tpb') return TPBank.GET_TRANSACTION(req, res, next)
		else return next()
	})

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

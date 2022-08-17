const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const MomoController = require('../main/momo')
const ZaloPayController = require('../main/zalopay')
const WalletController = require('../controllers/wallet')
const DeckController = require('../controllers/deck')
const { validateBody, validateParam, schemas, validateQuery } = require('../helpers/routerHelpers')
const queue = require('express-queue')
const SecurityController = require('../controllers/security')

router
	.route('/:bank/checkTranfer')
	.post(
		passport.authenticate('jwt', { session: false }),
		validateParam(schemas.typeWalletSchema, 'bank'),
		validateBody(schemas.checkTranferWeb),
		DeckController.checkDateIdBank,
		MomoController.CHECK_USER_PRIVATE,
		WalletController.GET_NAME_TRANFER
	)

router.route('/:bank/tranfer').post(
	queue({
		activeLimit: 10,
		queuedLimit: 5,
		rejectHandler: (req, res) => {
			res.status(503).json({
				success: false,
				error: {
					message: 'Bạn đang trong hàng chờ, vui lòng thử lại sau vài giây.',
				},
			})
		},
	}),
	passport.authenticate('jwt', { session: false }),
	validateParam(schemas.typeWalletSchema, 'bank'),
	validateBody(schemas.tranferDataWeb),
	DeckController.checkDateIdBank,
	SecurityController.verifyOTP,
	WalletController.CHECK_MONEY,
	MomoController.M2MU_INIT_WEB,
	MomoController.M2MU_CONFIRM
)

router.route('/:bank/sendMoney').post(
	queue({
		activeLimit: 10,
		queuedLimit: 5,
		rejectHandler: (req, res) => {
			res.status(503).json({
				success: false,
				error: {
					message: 'Bạn đang trong hàng chờ, vui lòng thử lại sau vài giây.',
				},
			})
		},
	}),
	validateParam(schemas.typeWalletSchema, 'bank'),
	validateBody(schemas.tranferData),
	DeckController.checkDate,
	WalletController.CHECK_MONEY,
	MomoController.CHECK_USER_PRIVATE,
	MomoController.M2MU_INIT,
	MomoController.M2MU_CONFIRM
)
router.route('/:bank/getOTP').post(
	passport.authenticate('jwt', { session: false }),
	validateParam(schemas.typeWalletSchema, 'bank'),
	validateBody(schemas.getOTPWallet),
	DeckController.checkExpired,
	WalletController.createImei,
	(req, res, next) => {
		if (req.value.params.bank == 'momo') return MomoController.CHECK_USER_BE_MSG(req, res, next)
		else return ZaloPayController.checkPhoneNumber(req, res, next)
	},
	(req, res, next) => {
		if (req.value.params.bank == 'momo') return MomoController.SEND_OTP_MSG(req, res, next)
		else return ZaloPayController.SEND_OTP_ZALOPAY(req, res, next)
	},
	WalletController.SEND_OTP
)
router.route('/:bank/confirmOTP').post(
	passport.authenticate('jwt', { session: false }),
	validateParam(schemas.typeWalletSchema, 'bank'),
	validateBody(schemas.confirmOTPWallet),
	WalletController.createImei,
	(req, res, next) => {
		if (req.value.params.bank == 'momo') return MomoController.REG_DEVICE_MSG(req, res, next)
		else return ZaloPayController.CONFIRM_OTP_ZALOPAY(req, res, next)
	},
	(req, res, next) => {
		if (req.value.params.bank == 'momo') return MomoController.USER_LOGIN_MSG(req, res, next)
		else return ZaloPayController.GET_SALT(req, res, next)
	},
	(req, res, next) => {
		if (req.value.params.bank == 'zalopay') return ZaloPayController.LOGIN(req, res, next)
		else next()
	},
	WalletController.CONFIRM_OTP
)
router.route('/:bank/getBalance').get(
	validateParam(schemas.typeWalletSchema, 'bank'),
	validateBody(schemas.tokenSchema),
	DeckController.checkDate,

	(req, res, next) => {
		if (req.value.params.bank == 'momo') return MomoController.SOF_LIST_MANAGER_MSG(req, res, next)
		else return ZaloPayController.GET_BALANCE(req, res, next)
	},
	(req, res, next) => {
		if (req.value.params.bank == 'momo') {
			if (req.nextName == 'token') return MomoController.GENERATE_TOKEN_AUTH_MSG(req, res, next)
			else return next()
		} else next()
	},
	(req, res, next) => {
		if (req.value.params.bank == 'momo') {
			if (req.nextName == 'login') return MomoController.USER_LOGIN_MSG(req, res, next)
			else return next()
		} else next()
	},
	WalletController.GET_BALANCE
)

router
	.route('/:bank/getTransaction')
	.get(validateParam(schemas.typeWalletSchema, 'bank'), validateBody(schemas.tokenSchema), DeckController.checkDate, WalletController.GET_TRANSACTION)

module.exports = router

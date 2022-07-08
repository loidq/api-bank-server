const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const MomoController = require('../main/momo')
const WalletController = require('../controllers/wallet')
const DeckController = require('../controllers/deck')
const { validateBody, validateParam, schemas, validateQuery } = require('../helpers/routerHelpers')

router
	.route('/tranfer/:bank')
	.post(
		validateParam(schemas.typeWalletSchema, 'bank'),
		validateBody(schemas.tranferData),
		DeckController.checkDate,
		MomoController.SOF_LIST_MANAGER_MSG,
		WalletController.CHECK_MONEY,
		MomoController.CHECK_USER_PRIVATE,
		MomoController.M2MU_INIT,
		MomoController.M2MU_CONFIRM
	)
router
	.route('/:bank/getOTP')
	.post(
		passport.authenticate('jwt', { session: false }),
		validateParam(schemas.typeWalletSchema, 'bank'),
		validateBody(schemas.getOTPWallet),
		DeckController.checkExpired,
		WalletController.createImei,
		MomoController.CHECK_USER_BE_MSG,
		MomoController.SEND_OTP_MSG,
		WalletController.SEND_OTP_MOMO
	)
router
	.route('/:bank/confirmOTP')
	.post(
		passport.authenticate('jwt', { session: false }),
		validateParam(schemas.typeWalletSchema, 'bank'),
		validateBody(schemas.confirmOTPWallet),
		WalletController.createImei,
		MomoController.REG_DEVICE_MSG,
		MomoController.USER_LOGIN_MSG,
		WalletController.CONFIRM_OTP_MOMO
	)
router
	.route('/:bank/getBalance')
	.get(
		validateParam(schemas.typeWalletSchema, 'bank'),
		validateBody(schemas.tokenSchema),
		DeckController.checkDate,
		MomoController.SOF_LIST_MANAGER_MSG,
		WalletController.GET_BALANCE
	)

router
	.route('/:bank/getTransaction')
	.get(validateParam(schemas.typeWalletSchema, 'bank'), validateBody(schemas.tokenSchema), DeckController.checkDate, WalletController.GET_TRANSACTION)
module.exports = router

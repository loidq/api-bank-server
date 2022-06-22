const router = require('express-promise-router')()

const SecurityController = require('../controllers/security')

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const { validateBody, schemas } = require('../helpers/routerHelpers')

router.route('/qrcode').get(passport.authenticate('jwt', { session: false }), SecurityController.generateQRCodeBase64)

router.route('/verify2FA').post(passport.authenticate('jwt', { session: false }), validateBody(schemas.verifyOTP), SecurityController.verify2FA)

module.exports = router

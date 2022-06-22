const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const RechargeController = require('../controllers/recharge')

router.route('/syntax').get(passport.authenticate('jwt', { session: false }), RechargeController.getSyntax)

router.route('/histories').get(passport.authenticate('jwt', { session: false }), RechargeController.getHistory)
module.exports = router

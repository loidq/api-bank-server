const router = require('express-promise-router')()

const passport = require('passport')
const passportConfig = require('../middlewares/passport')

const PriceController = require('../controllers/price')
const { validateBody, validateParam, schemas, validateQuery } = require('../helpers/routerHelpers')
router.route('/list').get(passport.authenticate('jwt', { session: false }), PriceController.priceList)
// router
// 	.route('/update/:idPrice')
// 	.post(
// 		passport.authenticate('jwt', { session: false }),
// 		validateParam(schemas.idSchema, 'idPrice'),
// 		validateBody(schemas.updatePriceSchema),
// 		PriceController.priceUpdate
// 	)
module.exports = router

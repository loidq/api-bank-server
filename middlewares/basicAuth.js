const { newError } = require('../helpers/routerHelpers')

const authPage = (permission) => {
	return (req, res, next) => {
		let { roles } = req.user
		if (!roles.includes(permission)) {
			return res.status(403).json({
				success: false,
				error: {
					message: 'Bạn không có quyền truy cập!!!',
				},
			})
		}
		next()
	}
}

module.exports = {
	authPage,
}

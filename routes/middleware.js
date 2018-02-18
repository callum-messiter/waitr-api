// Helpers
const e = require('../helpers/error');
// Models
const Auth = require('../models/Auth');

module.exports.authoriseUser = function(req, res, next) {
	// Check that the auth header is provided
	if(req.headers.authorization == undefined) return next(e.missingRequiredHeaders);
	// Verify the token
	Auth.verifyToken(req.headers.authorization)
	.then((decodedPayload) => {
		// Add the token to the response-local var, so we can access it in the controllers
		res.locals.authUser = decodedPayload;
		return next();
	}).catch((err) => {
		return next(err);
	});
}
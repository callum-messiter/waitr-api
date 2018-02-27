// Default error message for client to render to user
const defaultUserMsg = 'Oops! The waiter system experienced an error - please try again. If the issue persists, contact our support team.';

/**
	When adding a new error, ensure that the key of the error object has the same name as its errorKey value
	
	When when returning one of these errors, simply reference it by the keys below. The error handling middleware
	will handle building the error response.
**/
const errors = {
	/**
		Auth
	**/
	missingRequiredHeaders: {
		statusCode: 400,
		errorKey: 'missingRequiredHeaders',
		userMsg: defaultUserMsg
	},
	missingRequiredParams: {
		statusCode: 400,
		errorKey: 'missingRequiredParams',
		userMsg: defaultUserMsg
	},
	jwtMalformed: {
		statusCode: 401,
		errorKey: 'jwtMalformed',
		userMsg: 'Oops! Your session has expired. Log in to continue using waitr.'
	},
	insufficientPermissions: {
		statusCode: 403,
		errorKey: 'insufficientPermissions',
		userMsg: defaultUserMsg
	},
	emailNotRegistered: {
		statusCode: 401,
		errorKey: 'emailNotRegistered',
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	passwordIncorrect: {
		statusCode: 401,
		errorKey: 'passwordIncorrect',
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	userNotActive: {
		statusCode: 401,
		errorKey: 'userNotActive',
		userMsg: 'This account is not currently active. You can restore your account by clicking here.'
	},

	/**
		Users
	**/
	userNotFound: {
		statusCode: 404,
		errorKey: 'userNotFound',
		userMsg: defaultUserMsg
	},
	emailAlreadyRegistered: {
		statusCode: 404,
		errorKey: 'emailAlreadyRegistered',
		userMsg: 'That email address is already registered to an account! If you\'ve forgotten your password, contact support.'
	},
	currentPasswordIncorrect: {
		statusCode: 401,
		errorKey: 'currentPasswordIncorrect',
		userMsg: 'Incorrect password. Please double-check and try again.'
	},
	userAlreadyVerified: {
		statusCode: 409,
		errorKey: 'userAlreadyVerified',
		userMsg: 'Your account is already verified. Go ahead and log in.'
	},
	alreadyCurrentEmail: {
		statusCode: 409,
		errorKey: 'alreadyCurrentEmail',
		userMsg: 'That email address is already registered to your account. Go ahead and log in.'
	},

	/**
		Restaurants
	**/
	restaurantNotFound: {
		statusCode: 404,
		errorKey: 'restaurantNotFound',
		userMsg: defaultUserMsg
	},

	/**
		Menus
	**/
	menuNotFound: {
		statusCode: 404,
		errorKey: 'menuNotFound',
		userMsg: defaultUserMsg
	},

	/**
		Categories
	**/
	categoryNotFound: {
		statusCode: 404,
		errorKey: 'categoryNotFound',
		userMsg: defaultUserMsg
	},

	/**
		Items
	**/
	itemNotFound: {
		statusCode: 404,
		errorKey: 'itemNotFound',
		userMsg: defaultUserMsg
	},

	/**
		SQL
	**/
	sqlInsertFailed: {
		statusCode: 500,
		errorKey: 'sqlInsertFailed',
		userMsg: defaultUserMsg
	},
	sqlUpdateFailed: {
		statusCode: 500,
		errorKey: 'sqlUpdateFailed',
		userMsg: defaultUserMsg
	},
	resourceAlreadyInactive: {
		statusCode: 409,
		errorKey: 'resourceAlreadyInactive',
		userMsg: defaultUserMsg
	},

	/**
		Unhandled
	**/
	internalServerError: {
		statusCode: 500,
		errorKey: 'internalServerError',
		userMsg: defaultUserMsg
	}
}

function errorHandler(err, req, res, next) {
	// Log the error
	console.log(err);
	// Check that we are handling the error
	if(errors.hasOwnProperty(err.errorKey)) {
		res.status(errors[err.errorKey].statusCode)
		return res.json(err);
	}
	// If the error is not handled, return a general 500
	res.status(errors.internalServerError.statusCode);
	res.json(errors.internalServerError);
}

module.exports.errors = errors;
module.exports.errorHandler = errorHandler;
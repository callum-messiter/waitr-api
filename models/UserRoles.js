// Config
const db = require('../config/database');

/**
	The available roles. {roleTitle: roleId}
**/
module.exports.roleIDs = {
	'diner': 100,
	'restaurateur': 200,
	'userAdmin': 500,
	'waiterAdmin': 900
}

/**
	Sets the user's role
**/
module.exports.setUserRole = function(userDetails, callback) {
	const query = 'INSERT INTO userroles SET ?'
	db.query(query, userDetails, callback);
}

/**
	Gets the user's role
**/
module.exports.getUserRole = function(userId, callback) {
	const query = 'SELECT roleId FROM userroles WHERE userId = ?';
	db.query(query, userId, callback);
}
// Dependencies
// Config
const db = require('../config/database');

module.exports.addSocket = function(data, callback) {
	var tableName;
	if(data.hasOwnProperty('restaurantId')) {
		tableName = 'socketsrestaurants';
	} else if(data.hasOwnProperty('customerId')) {
		tableName = 'socketscustomers';
	}

	const query = 'INSERT INTO ' + tableName + ' SET ?';
	db.query(query, data, callback);
}

module.exports.removeSocket = function(socketId, type, callback) {
	var tableName;
	if(type == 'restaurant') {
		tableName = 'socketsrestaurants';
	} else if(type == 'customer') {
		tableName = 'socketscustomers';
	}

	const query = 'DELETE FROM ' + tableName +
				  ' WHERE socketId = ?';
	db.query(query, socketId, callback);
}

module.exports.addSocketToRestaurantCustomers = function(data, callback) {
	const query = 'INSERT INTO socketsrestaurantcustomers SET?';
	db.query(query, data, callback);
}

module.exports.getRecipientRestaurantSockets = function(restaurantId, callback) {
	const query = 'SELECT socketId FROM socketsrestaurants ' + 
				  'WHERE restaurantId = ?';
	db.query(query, restaurantId, callback);
}

/**
	TODO: Here we should be querying the socketsrestaurantcustomers table, which is a list
	of customer sockets that are currently connected and ordering at a given restaurant.

	But is this useful, vs. querying the list of *all* connected sockets using the customerId?

	The lists should be equal in size.

	Would it be better to abolish the socketsrestaurantcustomers table? And just have a list of
	all connected sockets in the process of ordering? Each socket would be added to this list 
	when an order is placed (id, socketId, customerId, recipientRestaurantId, date). 

	Then we don't need to add the customer sockets to the database when they *connect* to the server.

	Then this query would be better: when the restaurant updates the order status, and we need to find the customer socket
	to send the update to, we would query this list with the restaurantId from the orderStatusUpdate payload, and grab all
	socketIds from the rows with this restaurantId.

	The restaurantId column will be indexed, making this faster.

**/
module.exports.getRecipientCustomerSockets = function(customerId, callback) {
	const query = 'SELECT socketId FROM socketscustomers ' + 
				  'WHERE customerId = ?';
	db.query(query, customerId, callback);
}
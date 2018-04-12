const db = require('../config/database');
const config = require('../config/config');
const stripe = require("stripe")(config.stripe.secretKey);
stripe.setApiVersion('2018-02-28');
const e = require('../helpers/error').errors;	

module.exports.createRestaurantStripeAccount = function(account) {
	return new Promise((resolve, reject) => {
		stripe.accounts.create({
			type: 'custom',
			email: 'adam@waterlane.com',
			business_name: 'Water Lane Brasserie',		
			country: 'GB',
			default_currency: 'GBP',
			legal_entity: {
				//dob: {
					//day: '01',
					//month: '12',
					//year: '1970',
				//},
				//address: {
					//city: 'Canterbury',
					//line1: '12 Baker Street',
					//postal_code: 'Ct33ld'
				//},
				first_name: 'Adam',
				last_name: 'Smith',
				type: 'individual'
			}
			// external_account: account.stripeToken
		}).then((account) => {
			return resolve(account);
		}).catch((err) => {
			return reject(err);
		});
	});
}

module.exports.tokenizeRestaurantBankAccountDetails = function(account) {
	return new Promise((resolve, reject) => {
		stripe.createToken('bank_account', {
			country: account.country,
			currency: account.currency,
			routing_number: account.routingNum,
			account_number: account.accountNum,
			account_holder_name: account.holderName,
			account_holder_type: account.holderType,
		}).then((token) => {
			return resolve(token);
		}).catch((err) => {
			return reject(err);
		});
	});
}

module.exports.saveRestaurantStripeAccountDetails = function(data) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO restaurantdetailspayment SET ?';
		db.query(query, data, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			return resolve(result);
		});
	});
}

module.exports.getOrderPaymentDetails = function(orderId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT source, destination, currency, amount, customerEmail ' +
					  'FROM payments ' +
					  'WHERE orderId = ?';
		db.query(query, orderId, (err, details) => {
			if(err) return reject(err);
			return resolve(details);
		});
	});
}

module.exports.processCustomerPaymentToRestaurant = function(payment) {
	return new Promise((resolve, reject) => {
		stripe.charges.create({
		  amount: payment.amount,
		  currency: payment.currency,
		  source: payment.source, // the stripe token representing the customer's card details
		  destination: {
		    account: payment.destination, // the recipient restaurant's stripe account ID
		  },
		  receipt_email: payment.customerEmail // the diner may specify an email address that is not their waitr one
		}).then((charge) => {
			return resolve(charge);
		}).catch((err) => {
			return reject(err);
		});
	});
}

module.exports.getRestaurantPaymentDetails = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT stripeAccountId AS destination, currency ' + 
					  'FROM restaurantdetailspayment ' +
					  'WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, details) => {
			if(err) return reject(err);
			resolve(details);
		});
	});
}

/**
	When we do this, we reference the charge using the orderId.
	THis will be problematic if a single order can have multiple payments (this should not be allowed, enforce it.)
	But what if the the user tries to pay, the payment is rejected by Stripe, and then the user tries again?
	Then we will have two payment entries with the same orderId. 
	We have to receive the order, add the payment row, then when the order is accepted by the restaurant, 
	retrieve the payment row, and process the payment. 
	Then once payment is processed, we update the payment row by adding the chargeId we get back from Stripe, and by
	setting paid = 1.
	All we can do for now is impose a unique restriction on the payments.orderId column, and then if there is a payment
	error, the diner app will have to just reset the order (diner starts again, so the orderId will change).
	Later, we could set a unique paymentId - order.payment.paymentId.
**/
module.exports.updateChargeDetails = function(orderId, details) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE payments SET ? ' +
					  'WHERE orderId = ?';
		db.query(query, [details, orderId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
		});
	});
}
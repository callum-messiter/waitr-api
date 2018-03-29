const router = require('express').Router();
const Restaurant = require('../models/restaurant');
const Payment = require('../models/payment');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

/**
	In order to allow a restaurant receive payments via waitr, we must create a Stripe account that 
	represents the restaurant.

	This account will be connected to the waitr Stripe account. Money will flow like so:

	Customer bank account -> Waitr Stripe account -> Recipient Restaurant Stripe account -> Restaurant bank account

	The following details are required to create the restaurant's Stripe account, and to allow payouts from the restaurant's
	Stripe account to their bank account:

	{
		country: "UK",
		type: "custom",
		email: "accountHolder@email.com",
		business_name: "restaurantName",
		default_currency: "GBP",
		external_account: "stripeToken" // returned when we send the card details to the Stripe API via the checkout form
	}

	When we create the account via Stripe, Stripe will respond with an object, containing an ID. We must store this ID in 
	the database, so that we can reference the restaurant's Stripe account for payments/charges (`destination`).
**/
router.post('/createStripeAccount', (req, res, next) => {
	const u = res.locals.authUser;

	const requiredParams = {
		query: [],
		body: ['restaurantId', 'country', 'email', 'restaurantName', 'currency'], // stripeToken
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Restaurant.getRestaurantOwnerId(req.body.restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		const details = {
			type: 'custom',
			email: req.body.email,
			business_name: req.body.restaurantName,
			country: req.body.country,
			default_currency: req.body.currency,
			// external_account: req.body.stripeToken
		};
		return Payment.createRestaurantStripeAccount(req.body.restaurantId, details);

	}).then((account) => {

		const data = {restaurantId: req.body.restaurantId, stripeAccountId: account.id};
		return Payment.saveRestaurantStripeAccountDetails(data);

	}).then(() => {
		return res.status(200).json();
	}).catch((err) => {
		return next(err);
	});
});

/**
	For when the restaurant needs to update the details of their account, e.g. their bank account details.

	The requested must provide ther restaurant's ID. We will use this to query the database for the restaurant's
	Stripe Account ID. We will use this ID to call Stripe's API.
**/
router.patch('/updateStripeAccount', (req, res, next) => {
	const u = res.locals.authUser;

	const requiredParams = {
		query: [],
		body: ['restaurantId'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;
});

module.exports = router;
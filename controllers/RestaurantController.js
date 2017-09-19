// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Restaurants = require('../models/Restaurants');
const Auth = require('../models/Auth');
const Users = require('../models/Users');

// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');

/**
	Get a restaurant and its details
**/
router.get('/:restaurantId', (req, res, next) => {
		// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.restaurantId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a restaurantId and a token. At least one of these parameters was missing from the request.');
	} else {
		const restaurantId = req.params.restaurantId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				Restaurants.getRestaurantOwnerId(restaurantId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_restaurant_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'owner_id_not_found',
							'The query returned zero results. It is likely that a restaurant with the specified ID does not exist.')
					} else {
						const requesterId = decodedpayload.userId;
						const ownerId = result[0].ownerId;
						// User details can be accessed only by the owner, or by an internal admin. Future: restaurant details accessible to users granted access by restaurant owner
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A restaurant\'s details can be accessed only by the owner.');
						} else {
							// Get the restaurant details
							Restaurants.getRestaurantById(restaurantId, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'get_restaurant_query_error', err);
								} else if(result.length < 1) {
									ResponseHelper.sendError(res, 404, 'restaurant_not_found', 
										'The user appears to have zero registered restaurants.');
								} else {
									// There may be multiple restaurants owned by a single user; for now, get the first restuarant returned
									const restaurant = {
										name: result[0].name,
										description: result[0].description,
										location: result[0].location,
										phoneNumber: result[0].phoneNumber,
										emailAddress: result[0].emailAddress
									}
									ResponseHelper.sendSuccess(res, 200, restaurant);
								}
							});
						}
					}
				});
			}
		});
	}
});

/**
	Create a new restaurant, assigned to the requester user
**/
router.post('/create/:userId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header and a userId. At least one of these params was missing.");
	} else {
		// Check required item data
		if(!req.body.name || !req.body.description || !req.body.location || !req.body.phoneNumber || !req.body.emailAddress) {
			ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a name, description, location, phone number and email address. At least one was missing.');
		} else {
			const token = req.headers.authorization;
			const userId = req.params.userId;
			const restaurant = req.body;

			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					ResponseHelper.sendError(res, 401, 'invalid_token', 
						'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
				} else {
					// Check that the user with the specified ID exists (we need to check that the user is who they say they are, using session)
					Users.getUserById(userId, (err, result) => {
						if(err) {
							ResponseHelper.sendError(res, 500, 'get_user_query_error', err);
							//ResponseHelper.sendError(res, 500, 'get_user_query_error', err);
						} else if(result.length < 1) {
							ResponseHelper.sendError(res, 404, 'user_not_found', 
								'The query returned zero results. It is likely that a user with the specified ID does not exist');
						} else {
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != userId) {
								ResponseHelper.sendError(res, 401, 'unauthorised', 
									'A restaurant cannot be created for a user on another user\'s behalf.');
							} else {
								// Create restaurant
								Restaurants.createNewRestaurant(userId, restaurant, (err, result) => {
									if(err) {
										ResponseHelper.sendError(res, 500, 'create_restaurant_query_error', err);
									} else {
										// Return the ID of the new restaurant
										ResponseHelper.sendSuccess(res, 200, {createdRestaurantId: result.insertId});
									}
								});
							}
						}
					});
				}
			});
		}
	}
});

/**
	Update the details of a category
**/
router.put('/update/:restaurantId', (req, res, next) => {
	// Check auth header and restaurantId param
	if(!req.headers.authorization || !req.params.restaurantId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header, and a restaurantId. At least one of these params was missing.");
	} else {
		// Function for validating data: params must be valid, and required parmas must be provided
		const token = req.headers.authorization;
		const restaurantId = req.params.restaurantId;
		const restaurantData = req.body;
		// Check that the body params are allowed; write an external helper function for this
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				// Check that the requester owns the menu
				Restaurants.getRestaurantOwnerId(restaurantId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_restaurant_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that a restaurant with the specified ID does not exist');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A restaurant can be modified only by its owner.');
						} else {
							// Update Menu
							Restaurants.updateRestaurantDetails(restaurantId, restaurantData, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'update_restaurant_query_error', err);
								} else if(result.changedRows < 1) {
									QueryHelper.diagnoseQueryError(result, res);
								} else {
									ResponseHelper.sendSuccess(res, 200);					
								}
							});
						}
					}
				});
			}
		});
	}
});

module.exports = router;
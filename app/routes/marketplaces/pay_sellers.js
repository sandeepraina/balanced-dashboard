Balanced.MarketplacePaySellersRoute = Balanced.AuthRoute.extend({
	pageTitle: 'Pay Multiple Sellers',

	setupController: function(controller, model) {
		this._super(controller, model);

		var marketplace = this.modelFor('marketplace');

		// controller.set('content', Balanced.Customer.create({
		// 	uri: marketplace.get('customers_uri'),
		// 	address: {}
		// }));
		// controller.set('optionalFieldsOpen', false);
	}
});

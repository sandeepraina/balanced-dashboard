module('Invoices', {
	setup: function() {
		Balanced.TEST.setupMarketplace();
		Ember.run(function() {
			Balanced.Adapter = Balanced.FixtureAdapter.create();
			window.setupTestFixtures();
			var userId = '/users/USeb4a5d6ca6ed11e2bea6026ba7db2987';
			Balanced.Auth.setAuthProperties(
				true,
				Balanced.User.find(userId),
				userId,
				userId,
				false);
		});

		// click the invoices link
		$('#marketplace-nav .invoices a').click();
	},
	teardown: function() {

	}
});

test('can visit page', function(assert) {
	visit('/marketplaces/MP5m04ORxNlNDm1bB7nkcgSY/invoices').then(function() {
		//  check the page title has been selected
		assert.equal($('#content h1').text().trim(), 'Invoices');
	});
});

test('shows invoices list', function(assert) {
	visit('/marketplaces/MP5m04ORxNlNDm1bB7nkcgSY/invoices').then(function() {
		assert.equal($("#invoices table tbody tr").length, 2);
	});
});

test('invoice detail page', function(assert) {
	visit('/marketplaces/MP5m04ORxNlNDm1bB7nkcgSY/invoices/IVDOATjeyAPTJMJPnBR83uE')
		.then(function() {
			assert.equal($(".invoice-balance-due-box .amount").text().trim(), "$17.85");
			assert.equal($(".hold-details-row .total").text().trim(), "$17.85");
			assert.equal($(".card-debit-details-row .total").text().trim(), "$2.45");
			assert.equal($(".bank-account-debit-details-row .total").text().trim(), "$0.00");
			assert.equal($(".succeeded-credit-details-row .total").text().trim(), "$0.00");
			assert.equal($(".failed-credit-details-row .total").text().trim(), "$0.00");
			assert.equal($(".refund-details-row .total").text().trim(), "-$2.45");
			assert.equal($(".reversal-details-row .total").text().trim(), "$0.00");
			assert.equal($(".chargeback-details-row .total").text().trim(), "$0.00");
			assert.equal($(".subtotal-row .total").text().trim(), "$17.85");
			assert.equal($(".adjustments-row .total").text().trim(), "$0.00");
			assert.equal($(".total-balance-row .total").text().trim(), "$17.85");
		})
		.click('.activity .results header li.debit-cards a')
		.then(function() {
			assert.equal($('.activity table.transactions tbody tr').length, 3);

			// Check if the transaction is showing up correctly
			assert.equal($('.activity table.transactions tbody tr:eq(0) .type').text().trim(), 'Debit: succeeded');
			assert.equal($('.activity table.transactions tbody tr:eq(0) .account').text().trim(), 'AC3gu16bmtX9g3Gc9svlWC');
			assert.equal($('.activity table.transactions tbody tr:eq(0) .amount').text().trim(), '$24.15');
		})
		.click('.activity .results header li.holds a')
		.then(function() {
			// Show transactions correctly
			assert.equal($('.activity table.transactions tbody tr').length, 10);

			// Check if the transaction is showing up correctly
			assert.equal($('.activity table.transactions tbody tr:eq(0) .type').text().trim(), 'Hold: void');
			assert.equal($('.activity table.transactions tbody tr:eq(0) .account').text().trim(), 'slkfdjslkj (slkjlsj@gmail.com)');
			assert.equal($('.activity table.transactions tbody tr:eq(0) .amount').text().trim(), '$49.95');
		})
		.click('.activity .results header li.debit-bank-accounts a')
		.then(function() {
			assert.equal($('.activity table.transactions tbody tr .no-results').length, 1);
		})
		.click('.activity .results header li.credits a')
		.then(function() {
			assert.equal($('.activity table.transactions tbody tr .no-results').length, 1);
		})
		.click('.activity .results header li.refunds a')
		.then(function() {
			assert.equal($('.activity table.transactions tbody tr').length, 7);

			// Check if the transaction is showing up correctly
			assert.equal($('.activity table.transactions tbody tr:eq(0) .type').text().trim(), 'Refund');
			assert.equal($('.activity table.transactions tbody tr:eq(0) .account').text().trim(), 'Marc Sherry (msherry@gmail.com)');
			assert.equal($('.activity table.transactions tbody tr:eq(0) .amount').text().trim(), '$5.00');
		});
});

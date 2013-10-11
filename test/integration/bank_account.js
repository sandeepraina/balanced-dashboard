var settingsRoute, bankAccountRoute;

module('Bank Account Page', {
	setup: function() {
		Balanced.TEST.setupMarketplace();
		settingsRoute = '/marketplaces/' + Balanced.TEST.MARKETPLACE_ID + '/settings';
		Ember.run(function() {
			Balanced.BankAccount.create({
				name: 'Test Account',
				account_number: '1234',
				routing_number: '122242607',
				type: 'checking'
			}).save().then(function(bankAccount) {
				Balanced.TEST.BANK_ACCOUNT_ID = bankAccount.get('id');
				bankAccountRoute = '/marketplaces/' + Balanced.TEST.MARKETPLACE_ID +
					'/bank_accounts/' + Balanced.TEST.BANK_ACCOUNT_ID;
			});
		});
	},
	teardown: function() {}
});

test('can view bank account page', function(assert) {
	visit(settingsRoute)
		.click(".bank-account-info .sidebar-items li:eq(0) .name")
		.then(function() {
			assert.equal($("#content h1").text().trim(), 'Bank Account');
			assert.equal($(".title span").text().trim(), 'TEST-MERCHANT-BANK-ACCOUNT (5555)');
		});
});

test('credit bank account', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");

	visit(settingsRoute)
		.click(".bank-account-info .sidebar-items li:eq(0) .name")
		.click(".main-header .buttons a.credit-button")
		.fillIn('#credit-bank-account .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#credit-bank-account .modal-body input[name="description"]', 'Test credit')
		.click('#credit-bank-account .modal-footer button[name="modal-submit"]')
		.then(function() {
			// should be one create for the debit
			assert.ok(spy.calledOnce);
			assert.ok(spy.calledWith(Balanced.Credit, '/v1/customers/' + Balanced.TEST.CUSTOMER_ID + '/credits', sinon.match({
				amount: 100000,
				description: "Test credit"
			})));
		});
});

test('crediting only submits once despite multiple clicks', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(settingsRoute)
		.click(".bank-account-info .sidebar-items li:eq(0) .name")
		.click(".main-header .buttons a.credit-button")
		.fillIn('#credit-bank-account .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#credit-bank-account .modal-body input[name="description"]', 'Test credit')
		.click('#credit-bank-account .modal-footer button[name="modal-submit"]')
		.click('#credit-bank-account .modal-footer button[name="modal-submit"]')
		.click('#credit-bank-account .modal-footer button[name="modal-submit"]')
		.click('#credit-bank-account .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
		});
});

test('debit bank account', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");

	visit(settingsRoute)
		.click(".bank-account-info .sidebar-items li:eq(0) .name")
		.click(".main-header .buttons a.debit-button")
		.fillIn('#debit-funding-instrument .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#debit-funding-instrument .modal-body input[name="description"]', 'Test debit')
		.click('#debit-funding-instrument .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledOnce);
			assert.ok(spy.calledWith(Balanced.Debit, sinon.match(/\/v1\/bank_accounts\/(.*)\/debits/), sinon.match({
				amount: 100000,
				description: "Test debit"
			})));
		});
});

test('debiting only submits once despite multiple clicks', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(settingsRoute)
		.click(".bank-account-info .sidebar-items li:eq(0) .name")
		.click(".main-header .buttons a.debit-button")
		.fillIn('#debit-funding-instrument .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#debit-funding-instrument .modal-body input[name="description"]', 'Test debit')
		.click('#debit-funding-instrument .modal-footer button[name="modal-submit"]')
		.click('#debit-funding-instrument .modal-footer button[name="modal-submit"]')
		.click('#debit-funding-instrument .modal-footer button[name="modal-submit"]')
		.click('#debit-funding-instrument .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
		});
});

test('can initiate bank account verification', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(bankAccountRoute)
		.then(function() {
			assert.equal($('#content h1').text().trim(), 'Bank Account');
			assert.equal($(".main-header .buttons a.verify-button").length, 1, 'has verify button');
		})
		.then(function() {
			click(".main-header .buttons a.verify-button");
			assert.equal($('#verify-bank-account').css('display'), 'block', 'verify bank account modal visible');
		})
		.then(function() {
			click('#verify-bank-account .modal-footer button[name="modal-submit"]');
			assert.ok(stub.calledOnce);
			assert.ok(stub.calledWith(Balanced.Verification, sinon.match(/\/v1\/bank_accounts\/(.*)\/verifications/)));
		});
});

test('can confirm bank account verification', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(bankAccountRoute)
		.then(function() {
			assert.equal($('#content h1').text().trim(), 'Bank Account');
			assert.equal($(".main-header .buttons a.confirm-verification-button").length, 1, 'has confirm button');
		})
		.click(".main-header .buttons a.confirm-verification-button")
		.then(function() {
			assert.equal($('#confirm-verification').css('display'), 'block', 'confirm verification modal visible');
		})
		.fillIn('#confirm-verification .modal-body input[name="amount_1"]', '1.00')
		.fillIn('#confirm-verification .modal-body input[name="amount_2"]', '1.00')
		.click('#confirm-verification .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
			assert.ok(stub.calledWith(Balanced.Verification, sinon.match(/\/v1\/bank_accounts\/(.*)\/verifications/)));
			assert.ok(stub.getCall(0).args[2].amount_1, "1.00");
			assert.ok(stub.getCall(0).args[2].amount_2, "1.00");
			assert.ok(stub.getCall(0).args[2].state, "pending");
		});
});

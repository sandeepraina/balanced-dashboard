module('Customer Page', {
	setup: function() {
		Testing.setupMarketplace();
		Testing.createBankAccount();
		Testing.createCard();
	},
	teardown: function() {}
});

test('can view customer page', function(assert) {
	visit(Testing.CUSTOMER_ROUTE)
		.then(function() {
			assert.equal($('#content h1').text().trim(), 'Customer');
			assert.equal($(".title span").text().trim(), 'William Henry Cavendish III');
		});
});

test('can edit customer info', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "update");

	visit(Testing.CUSTOMER_ROUTE)
		.click('.customer-info a.edit')
		.fillIn('#edit-customer-info .modal-body input[name="name"]', 'TEST')
		.click('#edit-customer-info .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledOnce);
			assert.ok(spy.calledWith(Balanced.Customer));
			assert.ok(spy.getCall(0).args[2].name, 'TEST');
		});
});

test('can update customer info', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "update");

	visit(Testing.CUSTOMER_ROUTE)
		.click('.customer-info a.edit')
		.fillIn('#edit-customer-info .modal-body input[name="name"]', 'TEST')
		.fillIn('#edit-customer-info .modal-body input[name="email"]', 'TEST@example.com')
		.fillIn('#edit-customer-info .modal-body input[name="business_name"]', 'TEST')
		.fillIn('#edit-customer-info .modal-body input[name="ein"]', '1234')
		.click('#edit-customer-info a.more-info')
		.fillIn('#edit-customer-info .modal-body input[name="line1"]', '600 William St')
		.fillIn('#edit-customer-info .modal-body input[name="line2"]', 'Apt 400')
		.fillIn('#edit-customer-info .modal-body input[name="city"]', 'Oakland')
		.fillIn('#edit-customer-info .modal-body input[name="state"]', 'CA')
		.fillIn('#edit-customer-info .modal-body select[name="country_code"]', 'US')
		.fillIn('#edit-customer-info .modal-body input[name="postal_code"]', '12345')
		.fillIn('#edit-customer-info .modal-body input[name="phone"]', '1231231234')
		.fillIn('#edit-customer-info .modal-body input[name="dob_month"]', '12')
		.fillIn('#edit-customer-info .modal-body input[name="dob_year"]', '1924')
		.fillIn('#edit-customer-info .modal-body input[name="ssn_last4"]', '1234')
		.click('#edit-customer-info .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
			assert.ok(stub.calledWith(Balanced.Customer));
			assert.equal(stub.getCall(0).args[2].name, "TEST");
			assert.equal(stub.getCall(0).args[2].email, "TEST@example.com");
			assert.equal(stub.getCall(0).args[2].business_name, "TEST");
			assert.equal(stub.getCall(0).args[2].ein, "1234");
			assert.equal(stub.getCall(0).args[2].address.line1, "600 William St");
			assert.equal(stub.getCall(0).args[2].address.line2, "Apt 400");
			assert.equal(stub.getCall(0).args[2].address.city, "Oakland");
			assert.equal(stub.getCall(0).args[2].address.state, "CA");
			assert.equal(stub.getCall(0).args[2].address.country_code, "US");
			assert.equal(stub.getCall(0).args[2].address.postal_code, "12345");
			assert.equal(stub.getCall(0).args[2].phone, "1231231234");
			assert.equal(stub.getCall(0).args[2].dob_month, "12");
			assert.equal(stub.getCall(0).args[2].dob_year, "1924");
			assert.equal(stub.getCall(0).args[2].ssn_last4, "1234");
		});
});

test('can debit customer using card', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");
	var fundingInstrumentUri;

	visit(Testing.CUSTOMER_ROUTE).then(function() {
		// click the debit customer button
		return click(".customer-header .buttons a.debit-customer");
	}).then(function() {
		var options = $("#debit-customer form select[name='source_uri'] option");
		assert.equal(options.length, 3);

		// bank accounts first
		assert.equal(options.eq(0).text(), "Bank Account: 1234 (Wells Fargo Bank)");

		// cards second
		assert.equal(options.eq(2).text(), "Card: 3434 (Visa)");

		// select the card
		fundingInstrumentUri = options.eq(2).val();
		$("#debit-customer form select[name='source_uri']").val(fundingInstrumentUri).change();
		fillIn('#debit-customer .modal-body input[name="dollar_amount"]', '1000');
		fillIn('#debit-customer .modal-body input[name="description"]', 'Card debit');

		// click debit
		return click('#debit-customer .modal-footer button[name="modal-submit"]');
	}).then(function() {
		// should be one create for the debit
		assert.ok(spy.calledOnce);
		assert.ok(spy.calledWith(Balanced.Debit, fundingInstrumentUri + '/debits', sinon.match({
			amount: 100000,
			description: "Card debit"
		})));
	});
});

test('can debit customer using bank account', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");
	var fundingInstrumentUri;

	visit(Testing.CUSTOMER_ROUTE)
	// click the debit customer button
	.click($(".customer-header .buttons a").eq(0))
		.then(function() {
			assert.equal($("#debit-customer form select[name='source_uri'] option").length, 3);
		})
		.then(function() {
			// bank accounts first
			assert.equal($("#debit-customer form select[name='source_uri'] option").eq(0).text(), "Bank Account: 1234 (Wells Fargo Bank)");

			// cards second
			assert.equal($("#debit-customer form select[name='source_uri'] option").eq(1).text(), "Bank Account: 5555 (Wells Fargo Bank Na)");

			// select the bank account
			fundingInstrumentUri = $("#debit-customer form select[name='source_uri'] option").eq(0).val();
			$("#debit-customer select[name='source_uri']").val(fundingInstrumentUri);

			fillIn('#debit-customer .modal-body input[name="dollar_amount"]', '1000');
			fillIn('#debit-customer .modal-body input[name="description"]', 'Test debit');

			// click debit
			click('#debit-customer .modal-footer button[name="modal-submit"]');

			assert.ok(spy.calledOnce);
			assert.ok(spy.calledWith(Balanced.Debit, fundingInstrumentUri + '/debits', sinon.match({
				amount: 100000,
				description: "Test debit"
			})));
		});
});

test("can't debit customer multiple times using the same modal", function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	// click the debit customer button
	visit(Testing.CUSTOMER_ROUTE)
		.click(".customer-header .buttons a")
		.fillIn('#debit-customer .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#debit-customer .modal-body input[name="description"]', 'Test debit')
		.then(function() {
			for (var i = 0; i < 20; i++) {
				click('#debit-customer .modal-footer button[name="modal-submit"]');
			}

			assert.ok(stub.calledOnce);
		});
});

test("debit customer triggers reload of transactions", function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "get");

	visit(Testing.CUSTOMER_ROUTE)
		.click($(".customer-header .buttons a").eq(0))
		.fillIn('#debit-customer .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#debit-customer .modal-body input[name="description"]', 'Test debit')
		.click('#debit-customer .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledWith(Balanced.Transaction));
		});
});

test('can credit customer', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");

	visit(Testing.CUSTOMER_ROUTE)
		.click($(".customer-header .buttons a").eq(1))
		.fillIn('#credit-customer .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#credit-customer .modal-body input[name="description"]', 'Test credit')
		.click('#credit-customer .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledOnce);
			var fundingInstrumentUri = $("#debit-customer form select[name='source_uri'] option").eq(0).val();

			assert.ok(spy.calledWith(Balanced.Credit, fundingInstrumentUri + '/credits', sinon.match({
				amount: 100000,
				description: "Test credit"
			})));
		});
});

test('when crediting customer triggers an error, the error is displayed to the user', function(assert) {
	visit(Testing.CUSTOMER_ROUTE)
		.click($(".customer-header .buttons a").eq(1))
		.fillIn('#credit-customer .modal-body input[name="dollar_amount"]', '10000')
		.fillIn('#credit-customer .modal-body input[name="description"]', 'Test credit')
		.click('#credit-customer .modal-footer button[name="modal-submit"]')
		.then(function() {
			stop();
			Ember.run.next(function() {
				start();
				assert.equal($('.alert-error').is(':visible'), true);
			});
		});
});

test("can't credit customer multiple times using the same modal", function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	// click the credit customer button
	visit(Testing.CUSTOMER_ROUTE)
		.click($(".customer-header .buttons a").eq(1))
		.fillIn('#credit-customer .modal-body input[name="dollar_amount"]', '1000')
		.fillIn('#credit-customer .modal-body input[name="description"]', 'Test credit')
		.then(function() {
			for (var i = 0; i < 20; i++) {
				click('#credit-customer .modal-footer button[name="modal-submit"]');
			}

			assert.ok(stub.calledOnce);
		});
});

test('can add bank account', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");
	var tokenizingStub = sinon.stub(balanced.bankAccount, "create");
	tokenizingStub.callsArgWith(1, {
		status: 201,
		bank_accounts: [{
			href: '/bank_accounts/' + Testing.BANK_ACCOUNT_ID
		}]
	});

	visit(Testing.CUSTOMER_ROUTE)
		.click('.bank-account-info a.add')
		.fillIn('#add-bank-account .modal-body input[name="name"]', 'TEST')
		.fillIn('#add-bank-account .modal-body input[name="account_number"]', '123')
		.fillIn('#add-bank-account .modal-body input[name="routing_number"]', '123123123')
		.click('#add-bank-account .modal-body input[name="account_type"][value="checking"]')
		.click('#add-bank-account .modal-footer button[name="modal-submit"]')
		.then(function() {
			var input = {
				type: "checking",
				name: "TEST",
				account_number: "123",
				routing_number: "123123123"
			};

			// this tests balanced.js
			assert.ok(tokenizingStub.calledOnce);
			assert.ok(tokenizingStub.calledWith(input));

			//assert.ok(spy.calledOnce);
			//assert.ok(spy.calledWith(Balanced.BankAccount, '/bank_accounts', sinon.match(input)));

			balanced.bankAccount.create.restore();
		});
});

test('can add card', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");
	var tokenizingStub = sinon.stub(balanced.card, "create");
	tokenizingStub.callsArgWith(1, {
		status: 201,
		cards: [{
			href: '/cards/' + Testing.CARD_ID
		}]
	});

	visit(Testing.CUSTOMER_ROUTE)
		.click('.card-info a.add')
		.fillIn('#add-card .modal-body input[name="name"]', 'TEST')
		.fillIn('#add-card .modal-body input[name="number"]', '1234123412341234')
		.fillIn('#add-card .modal-body input[name="security_code"]', '123')
		.fillIn('#add-card .modal-body select[name="expiration_month"]', '1')
		.fillIn('#add-card .modal-body select[name="expiration_year"]', '2020')
		.click('#add-card .modal-footer button[name="modal-submit"]')
		.then(function() {
			var input = {
				number: "1234123412341234",
				expiration_month: 1,
				expiration_year: 2020,
				security_code: "123",
				name: "TEST"
			};

			// this tests balanced.js
			assert.ok(tokenizingStub.calledOnce);
			assert.ok(tokenizingStub.calledWith(sinon.match(input)));
			balanced.card.create.restore();

			//assert.ok(stub.calledOnce);
			//assert.ok(stub.calledWith(Balanced.Card, '/cards', sinon.match(input)));
		});
});

test('can add card with postal code', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");
	var tokenizingStub = sinon.stub(balanced.card, "create");
	tokenizingStub.callsArgWith(1, {
		status: 201,
		cards: [{
			href: '/cards/' + Testing.CARD_ID
		}]
	});

	visit(Testing.CUSTOMER_ROUTE)
		.click('.card-info a.add')
		.fillIn('#add-card .modal-body input[name="name"]', 'TEST')
		.fillIn('#add-card .modal-body input[name="number"]', '1234123412341234')
		.fillIn('#add-card .modal-body input[name="security_code"]', '123')
		.fillIn('#add-card .modal-body select[name="expiration_month"]', '1')
		.fillIn('#add-card .modal-body select[name="expiration_year"]', '2020')
		.fillIn('#add-card .modal-body input[name="postal_code"]', '94612')
		.click('#add-card .modal-footer button[name="modal-submit"]')
		.then(function() {
			var input = {
				number: "1234123412341234",
				expiration_month: 1,
				expiration_year: 2020,
				security_code: "123",
				name: "TEST",
				postal_code: "94612"
			};

			// this tests balanced.js
			assert.ok(tokenizingStub.calledOnce);
			assert.ok(tokenizingStub.calledWith(sinon.match(input)));
			balanced.card.create.restore();

			//assert.ok(stub.calledOnce);
			//assert.ok(stub.calledWith(Balanced.Card, '/cards', sinon.match(input)));
		});
});

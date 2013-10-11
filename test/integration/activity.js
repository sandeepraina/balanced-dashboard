var activityRoute;

module('Activity', {
	setup: function() {
		Balanced.TEST.setupMarketplace();
		var i = 4;
		Ember.run(function() {
			while (i > 0) {
				Balanced.Debit.create({
					uri: '/v1/customers/' + Balanced.TEST.CUSTOMER_ID + '/debits',
					appears_on_statement_as: 'Pixie Dust',
					amount: 10000,
					description: 'Cocaine'
				}).save();
				i--;
			}
		});
		activityRoute = '/marketplaces/' + Balanced.TEST.MARKETPLACE_ID + '/activity/transactions';
	},
	teardown: function() {}
});

test('can visit page', function(assert) {
	visit(activityRoute)
		.then(function() {
			var $title = $('#content h1');

			assert.notEqual($title.text().indexOf('Activity'), -1,
				'Title is incorrect');

			assert.ok($('#activity .download').length, "Download link is visible");
		});
});

test('Click load more shows 5 more and hides load more', function(assert) {
	visit(activityRoute)
		.then(function() {
			assert.equal($('#activity .results table.transactions tfoot td').length, 1, 'has "load more"');
		})
		.click('#activity .results table.transactions tfoot td.load-more-results a')
		.then(function() {
			assert.equal($('#activity .results table.transactions tbody tr').length, 4, 'has 4 transactions');
			assert.equal($('#activity .results table.transactions tfoot td').length, 0, 'does not have "load more"');
		});
});

test('add funds', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");

	visit(activityRoute)
		.then(function() {
			assert.equal($('.activity-escrow-box .amount .number1d').text().trim(), '$400.00', 'escrow amount is $400.00');
		})
		.click('.activity-escrow-box .btn')
		.then(function() {
			assert.equal($('#add-funds').css('display'), 'block', 'add funds modal visible');
			assert.equal($('#add-funds select option').length, 1, 'bank accounts in account dropdown');
		})
		.fillIn('#add-funds input', '55.55')
		.fillIn('#add-funds input.description', 'Adding lots of money yo')
		.click('#add-funds .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledOnce);
			assert.ok(spy.calledWith(Balanced.Debit, '/v1/customers/' + Balanced.TEST.CUSTOMER_ID + '/debits'));
			assert.equal(spy.getCall(0).args[2].amount, 5555);
			assert.equal(spy.getCall(0).args[2].description, 'Adding lots of money yo');
		});
});

test('add funds only adds once despite multiple clicks', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(activityRoute)
		.click('.activity-escrow-box .btn')
		.fillIn('#add-funds input', '55.55')
		.click('#add-funds .modal-footer button[name="modal-submit"]')
		.click('#add-funds .modal-footer button[name="modal-submit"]')
		.click('#add-funds .modal-footer button[name="modal-submit"]')
		.click('#add-funds .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
		});
});

test('withdraw funds', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");
	visit(activityRoute)
		.then(function() {
			assert.equal($('.activity-escrow-box .amount .number1d').text().trim(), '$400.00', 'escrow amount is $400.00');
		})
		.click('.activity-escrow-box .btn')
		.then(function() {
			assert.equal($('#withdraw-funds').css('display'), 'block', 'withdraw funds modal visible');
			assert.equal($('#withdraw-funds select option').length, 1, 'bank accounts in account dropdown');
		})
		.fillIn('#withdraw-funds input', '55.55')
		.fillIn('#withdraw-funds input.description', 'Withdrawing some monies')
		.click('#withdraw-funds .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledOnce);
			assert.ok(spy.calledWith(Balanced.Credit, '/v1/customers/' + Balanced.TEST.CUSTOMER_ID + '/credits'));
			assert.equal(spy.getCall(0).args[2].amount, 5555);
			assert.equal(spy.getCall(0).args[2].description, 'Withdrawing some monies');
		});
});

test('withdraw funds only withdraws once despite multiple clicks', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(activityRoute)
		.click('.activity-escrow-box .btn')
		.fillIn('#withdraw-funds input', '55.55')
		.click('#withdraw-funds .modal-footer button[name="modal-submit"]')
		.click('#withdraw-funds .modal-footer button[name="modal-submit"]')
		.click('#withdraw-funds .modal-footer button[name="modal-submit"]')
		.click('#withdraw-funds .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
		});
});

test('download activity', function(assert) {
	assert.equal($(".alert span").length, 0);

	var stub = sinon.stub(Balanced.Adapter, "create");
	stub.withArgs(Balanced.Download).callsArgWith(3, {
		download: {}
	});

	visit(activityRoute)
		.click("#activity .icon-download")
		.fillIn(".download-modal.in form input[name='email']", "test@example.com")
		.click('.download-modal.in .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
			assert.ok(stub.calledWith(Balanced.Download, '/downloads', {
				email_address: "test@example.com",
				uri: "/v1/marketplaces/" + Balanced.TEST.MARKETPLACE_ID + "/search?limit=2&offset=0&q=&sort=created_at%2Cdesc&type%5Bin%5D=credit%2Cdebit%2Crefund%2Chold"
			}));
			assert.equal($(".alert span").length, 1);
			assert.equal($(".alert span").text(), "We're processing your request. We will email you once the exported data is ready to view.");
		});
});

test('download activity only runs once despite multiple clicks', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(activityRoute)
		.click("#activity .icon-download")
		.fillIn(".download-modal.in form input[name='email']", 'test@example.com')
		.click('.download-modal.in .modal-footer button[name="modal-submit"]')
		.click('.download-modal.in .modal-footer button[name="modal-submit"]')
		.click('.download-modal.in .modal-footer button[name="modal-submit"]')
		.click('.download-modal.in .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
		});
});

test('transactions date sort has two states', function(assert) {
	visit(activityRoute)
		.then(function() {
			var objectPath = "#activity .results th.date";
			var states = [];
			var getState = function() {
				if ($(objectPath).hasClass("unsorted")) {
					if ($.inArray("unsorted", states) === -1) {
						states.push("unsorted");
					}
				} else if ($(objectPath).hasClass("ascending")) {
					if ($.inArray("ascending", states) === -1) {
						states.push("ascending");
					}
				} else if ($(objectPath).hasClass("descending")) {
					if ($.inArray("descending", states) === -1) {
						states.push("descending");
					}
				}
			};

			var count = 0;
			var testAmount = 5;
			while (count !== testAmount) {
				click($(objectPath));
				getState();
				count++;
			}
			states.sort();

			var expectedStates = ["ascending", "descending"];
			assert.equal(states[0], expectedStates[0]);
			assert.equal(states[1], expectedStates[1]);
			assert.equal(states.length, 2);
		});
});

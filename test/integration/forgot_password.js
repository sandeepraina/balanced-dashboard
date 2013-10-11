module('ForgotPassword', {
	setup: function() {
		Balanced.TEST.setupMarketplace();
		Ember.run(function() {
			Balanced.Auth.setAuthProperties(false, null, null, null, false);
		});
	},
	teardown: function() {}
});

test('clicking forgot password from login takes you to the page', function(assert) {
	visit('/login')
		.click("form#auth-form a:eq(0)")
		.then(function() {
			assert.equal($("form#forgot-form").length, 1, 'The forgot form exists.');
		});
});

test('forgot password form submits', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "create");

	visit('/forgot_password')
		.fillIn("form#forgot-form input[name=email_address]", 'foo@bar.com')
		.click("form#forgot-form button")
		.then(function() {
			assert.equal($("div#content div.alert-black").length, 1, 'The black confirmation box is visible');

			assert.ok(spy.calledOnce);
			assert.ok(spy.calledWith(Balanced.ForgotPassword, '/password', sinon.match({
				email_address: 'foo@bar.com'
			})));
		});
});

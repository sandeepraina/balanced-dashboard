require('app/models/funding_instrument');

Balanced.BankAccount = Balanced.FundingInstrument.extend({
	uri: '/v1/bank_accounts',

	verifications: Balanced.Model.hasMany('verifications', 'Balanced.Verification'),
	verification: Balanced.Model.belongsTo('verification', 'Balanced.Verification'),

	type_name: function() {
		return 'Bank Account';
	}.property(),

	route_name: function() {
		return 'bank_accounts';
	}.property(),

	is_bank_account: true,

	appears_on_statement_max_length: function() {
		return Balanced.MAXLENGTH.APPEARS_ON_STATEMENT_BANK_ACCOUNT;
	}.property(),

	last_four: function() {
		var accountNumber = this.get('account_number');
		if (!accountNumber || accountNumber.length < 5) {
			return accountNumber;
		} else {
			return accountNumber.substr(accountNumber.length - 4, 4);
		}
	}.property('account_number'),

	description: function() {
		if (this.get('bank_name')) {
			return '%@ (%@)'.fmt(
				this.get('last_four'),
				Balanced.Utils.toTitleCase(this.get('bank_name'))
			);
		} else {
			return this.get('last_four');
		}
	}.property('last_four', 'bank_name'),

	can_verify: function() {
		return (!this.get('can_debit') && !this.get('can_confirm_verification') &&
			(this.get('customer') || this.get('account'))) || Ember.testing;
	}.property('can_debit', 'can_confirm_verification'),

	can_confirm_verification: function() {
		return (this.get('verification') &&
			this.get('verification.state') !== 'failed' &&
			this.get('verification.state') !== 'verified' &&
			this.get('verification.remaining_attempts') > 0) || Ember.testing;
	}.property('verification', 'verification.state', 'verification.remaining_attempts'),

	tokenizeAndCreate: function() {
		var self = this;
		var promise = this.resolveOn('didCreate');

		this.set('isSaving', true);
		var bankAccountData = {
			type: this.get('type'),
			name: this.get('name'),
			account_number: this.get('account_number'),
			routing_number: this.get('routing_number')
		};

		// Tokenize the bank account using the balanced.js library
		balanced.bankAccount.create(bankAccountData, function(response) {
			switch (response.status) {
				case 201:
					// Now that it's been tokenized, we just need to associate it with the customer's account
					var bankAccountAssociation = Balanced.BankAccount.create({
						uri: self.get('uri'),
						bank_account_uri: response.data.uri
					});
					bankAccountAssociation.save().then(function(savedBankAccount) {
						self.updateFromModel(savedBankAccount);
						self.set('isLoaded', true);
						self.set('isNew', false);
						self.set('isSaving', false);
						self.trigger('didCreate');
					}, function() {
						self.set('displayErrorDescription', true);
						self.set('errorDescription', 'Sorry, there was an error associating this bank account.');
						self.set('isSaving', false);
						promise.reject();
					});
					break;
				case 400:
					self.set('validationErrors', {});
					_.each(response.error, function(value, key) {
						self.set('validationErrors.' + key, 'invalid');
					});
					self.set('isSaving', false);
					promise.reject();
					break;
				default:
					self.set('displayErrorDescription', true);
					var errorSuffix = (response.error && response.error.description) ? (': ' + response.error.description) : '.';
					self.set('errorDescription', 'Sorry, there was an error tokenizing this bank account' + errorSuffix);
					self.set('isSaving', false);
					promise.reject();
					break;
			}
		});

		return promise;
	}
});

Balanced.TypeMappings.addTypeMapping('bank_account', 'Balanced.BankAccount');

// This is pulled out into a separate file so the Grunt neuter task doesn't
// add templating code to it while building

window.balancedSetupFunctions = [];

/*
Creates a new instance of an Ember application and
specifies what HTML element inside index.html Ember
should manage for you.
*/
window.setupBalanced = function(divSelector) {

	// default to #balanced-app if not specified
	divSelector = divSelector || '#balanced-app';
	ENV.HELPER_PARAM_LOOKUPS = true;
	window.Balanced = Ember.Application.create({
		rootElement: divSelector,
		LOG_TRANSITIONS: true,

		render: function() {
			// TODO: Massive Hack to trigger rerender
			// Needed when we load extensions as some change the current view
			return this.__container__.lookup('router:main')._activeViews.application[0].rerender();
		},

		customEvents: {
			// key is the jquery event, value is the name used in views
			changeDate: 'changeDate'
		}
	});

	window.Balanced.onLoad = function() {
		//  initialize anything that needs to be done on application load
		Balanced.Analytics.init(Ember.ENV.BALANCED);

		// Configure modal parent selector
		$.fn.modal.defaults.manager = divSelector;
	};

	_.each(window.balancedSetupFunctions, function(setupFunction) {
		setupFunction();
	});
};

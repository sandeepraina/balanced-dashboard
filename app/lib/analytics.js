window.mixpanel = window.mixpanel || [];
window._gaq = window._gaq || [];
if (!window.Intercom) {
    var i = function () {
        i.c(arguments);
    };
    i.q = [];
    i.c = function (args) {
        i.q.push(args);
    };

    window.Intercom = i;
}

Balanced.Analytics = (function () {
	if(!window.TESTING) {
		// This page will almost always be over https, so can just load this directly.
		$.getScript('https://ssl.google-analytics.com/ga.js', { cache: true });
		$.getScript('https://static.intercomcdn.com/intercom.v1.js', { cache: true });
	}

	// links the current id with this specific id
	function trackLogin(email) {
		try {
			window.mixpanel.alias(email);
			Raven.setUser({
				email: email
			});

			var intercomObj = _.extend({ email: email, "widget": { "activator": "#IntercomDefaultWidget" } }, ENV.BALANCED.INTERCOM);
			window.intercomSettings = intercomObj;
			window.Intercom('boot', intercomObj);
		} catch (err) {
		}
	}

	return {
		init: function (settings) {
			if (window.TESTING) {
				return;
			}

			window.mixpanel.init(settings.MIXPANEL);

			window._gaq.push(['_setAccount', settings.GOOGLE_ANALYTICS]);
			window._gaq.push(['_setDomainName', 'balancedpayments.com']);
			window._gaq.push(['_trackPageview']);

			Balanced.Auth.on('signInSuccess', function () {
				Balanced.Analytics.trackEvent('login-success', {remembered: false});

				var user = Balanced.Auth.get('user');
				trackLogin(user.get('email_address'));
			});

			Balanced.Auth.on('signInError', function () {
				Balanced.Analytics.trackEvent('login-error');
			});

			$(document).bind("ajaxComplete", function(evt, jqxhr, ajaxOptions) {
				if(jqxhr && jqxhr.status >= 400) {
					Balanced.Analytics.trackEvent('ajax-error', {
						status: jqxhr.status,
						ajaxUrl: ajaxOptions.url,
						type: ajaxOptions.type,
						responseText: jqxhr.responseText
					});
				}
			});

			// HACK: can't find an good way to track all events in ember atm
			// to track all click events
			$(document).on('click', 'a,.btn,button', function () {
				var e = $(this);
				// trims text contained in element
				var tt = e.text().replace(/^\s*([\S\s]*?)\s*$/, '$1');
				var eventName = 'click ' + tt;

				Balanced.Analytics.trackEvent(eventName, {});
			});
		},
		trackPage: _.debounce(function (page) {
			var currentLocation = page + location.hash;
			if (window.TESTING) {
				return;
			}
			window._gaq.push(['_trackPageview', currentLocation]);
			window.mixpanel.track_pageview(currentLocation);
		}, 500),
		trackEvent: function (name, data) {
			data = data || {};

			if (window.TESTING) {
				return;
			}

			if(Balanced.currentMarketplace) {
				data.marketplaceId = Balanced.currentMarketplace.get('id');
				data.marketplaceName = Balanced.currentMarketplace.get('name');
			}

			var filteredData = Balanced.Utils.filterSensitivePropertiesMap(data);
			window.mixpanel.track(name, filteredData);
			window._gaq.push(['_trackEvent', 'dashboard', name]);
		}
	};
})();

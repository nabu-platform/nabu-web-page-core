/**
 * Providers should optionally have these handlers:
 * - start: when the session is first started
 * - stop: when the session is stopped
 * - reauthenticate: when the authentication for the user changes
 * - push(data): an array of data structures, there are a few "reserved" fields
 * 		- event: the event name
 * 		- type: the event type
 */
Vue.service("analysis", {
	data: function() {
		return {
			provider: null,
			id: 0,
			environment: "${nabu.utils.Server.getServerGroup()/group}",
			mobile: navigator.userAgent.toLowerCase().indexOf("mobi") >= 0,
			platform: "${when(environment('mobile') == true, 'hybrid', 'website')}",
			application: "${environment('webApplicationId')}",
			language: "${language()}"
		}
	},
	methods: {
		apply: function(x) {
			nabu.page.providers("page-analysis").forEach(x);
		},
		start: function() {
			this.apply(function(x) {
				if (x.start) {
					x.start();
				}
			});
		},
		stop: function() {
			this.apply(function(x) {
				if (x.stop) {
					x.stop();
				}
			});
		},
		// type: the type of event (e.g. page-action, click,...)
		// name: the specific event, e.g. a specific button
		push: function(data) {
			var self = this;
			// enrich with environmental information
			data.meta = {
				environment: this.environment,
				mobile: this.mobile,
				platform: this.platform,
				application: this.application,
				language: this.language,
				created: new Date().toISOString(),
				url: window.location.href,
				referrer: document.referrer ? document.referrer : null,
				userAgent: navigator.userAgent
			};
			// we add the location if we have it
			if (this.$services.page.location) {
				data.location = this.$services.page.location;
			}
			this.apply(function(x) {
				if (x.push) {
					x.push(data);
				}
			});
			this.$services.page.report("analysis", data.source ? data.source : (data.pageName ? data.pageName : "$anonymous"), data.type, data.event, data);
		}
	},
	// if we upgrade the user credentials, a clear is triggered
	clear: function(done) {
		this.apply(function(x) {
			if (x.reauthenticate) {
				x.reauthenticate();
			}
		});
		done();
	}
});
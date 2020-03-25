/**
 * Providers should optionally have these handlers:
 * - start: when the session is first started
 * - stop: when the session is stopped
 * - reauthenticate: when the authentication for the user changes
 * - push(data): an array of data structures, there are a few "reserved" fields
 * 		- event: the event name
 * 		- type: the event type
 */
Vue.service("analysis",
	data: function() {
		return {
			provider: null,
			id: 0
		}
	},
	methods: {
		apply: function(x) {
			nabu.page.providers("page-enumerate").forEach(x);
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
			this.apply(function(x) {
				x.push(data);
			});
		}
	},
	// if we upgrade the user credentials, a clear is triggered
	clear: function(done) {
		this.apply(function(x) {
			if (x.reauthenticate) {
				x.reauthenticate();
			}
		});
	}
);
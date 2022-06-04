nabu.page.provide("page-renderer", {
	name: "Form",
	type: ["row", "cell"],
	component: "renderer-form",
	configuration: "renderer-form-configure",
	// can inject state into the page so we can manipulate it
	state: function(container) {
		if (container.form) {
			var operationId = container.form.operation;
			return application.services.page.getSwaggerOperationInputDefinition(operationId);
		}
	},
	// can emit events
	// e.g. a success event for form submit
	// an error event
	// a submit event (with the input state)
	events: function(container) {
		var result = {};
		if (container.form) {
			var operationId = container.form.operation;
			if (operationId) {
				if (container.form.submitEvent) {
					result[container.form.submitEvent] = application.services.page.getSwaggerOperationInputDefinition(operationId);
				}
				if (container.form.successEvent) {
					result[container.form.successEvent] = application.services.page.getSwaggerOperationOutputDefinition(operationId);
				}
			}
		}
		return result;
	},
	// return the child components in play for the given container
	// these can be added to the list of stuff to style
	childComponents: function(container) {
		
	}
});


Vue.component("renderer-form", {
	template: "#renderer-form",
	props: {
		page: {
			type: Object,
			required: true
		},
		// the target (cell or row)
		target: {
			type: Object,
			required: true
		},
		// whether or not we are in edit mode (we can do things slightly different)
		edit: {
			type: Boolean,
			required: false
		}
	},
	created: function() {
		if (this.target.form && this.target.form.noInlineErrors) {
			this.mode = null;
		}
		else {
			this.mode = "component";
		}
	},
	mounted: function() {
		// trigger a submit
		if (this.target.form && this.target.form.triggerEvent) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			
			var self = this;
			this.subscriptions.push(pageInstance.subscribe(this.target.form.triggerEvent, function() {
				// always fire the submit if available
				if (self.target.form.submitEvent) {
					pageInstance.emit(self.target.form.submitEvent, self.state);
				}
				console.log("subscription triggered!");
			}));
		}
	},
	data: function() {
		return {
			state: {},
			subscriptions: [],
			mode: null
		}
	},
	methods: {
		getState: function() {
			return this.state;		
		}
	}
});

Vue.component("renderer-form-configure", {
	template: "#renderer-form-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		// the target (cell or row)
		target: {
			type: Object,
			required: true
		}
	},
	created: function() {
		// normalize
		if (!this.target.form) {
			Vue.set(this.target, "form", {});
		}
	},
	methods: {
		getOperations: function(name) {
			var self = this;
			return this.$services.page.getOperations(function(operation) {
				// must be a put, post, patch or delete
				return (operation.method.toLowerCase() == "put" || operation.method.toLowerCase() == "post" || operation.method.toLowerCase() == "delete" || operation.method.toLowerCase() == "patch")
					// and contain the name fragment (if any)
					&& (!name || operation.id.toLowerCase().indexOf(name.toLowerCase()) >= 0);
			});
		}
	}
})
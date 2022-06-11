nabu.page.provide("page-renderer", {
	title: "Form",
	name: "form",
	type: ["row", "cell"],
	component: "renderer-form",
	configuration: "renderer-form-configure",
	// can inject state into the page so we can manipulate it
	getState: function(container) {
		if (container.form) {
			if (container.form.operation) {
				var operationId = container.form.operation;
				return application.services.page.getSwaggerOperationInputDefinition(operationId);
			}
			else if (container.form.fields) {
				var result = {};
				container.form.fields.forEach(function(x) {
					result[x.name] = {
						type: x.type ? x.type : "string"
					}
				});
				return {properties:result};
			}
		}
		else {
			return {};
		}
	},
	// can emit events
	// e.g. a success event for form submit
	// an error event
	// a submit event (with the input state)
	getEvents: function(container) {
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
	getChildComponents: function(container) {
		return [{
			title: "Form",
			name: "form",
			component: "form"
		}, {
			title: "Form Container",
			name: "form-container",
			component: "form-section"
		}];
	},
	getActions: function(container) {
		var actions = [];
		if (container && container.form && (container.form.operation || (container.form.fields && container.form.fields.length > 0))) {
			actions.push({
				title: "Submit",
				name: "submit"
			});
		}
		return actions;
	}
});


Vue.component("renderer-form", {
	template: "#renderer-form",
	mixins: [nabu.page.mixins.renderer],
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
		childComponents: {
			type: Object,
			required: false
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
		getRuntimeState: function() {
			return this.state;		
		},
		runAction: function(name, input) {
			if (name == "submit") {
				// do an operation call
				if (this.target.form.operation) {
					console.log("TODO: form operation submit");
				}
				else if (this.target.form.fields && this.target.form.fields.length) {
					this.$services.page.applyRendererParameters(this.$services.page.getPageInstance(this.page, this), this.target, this.state);
				}
			}
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
		if (!this.target.form.bindings) {
			Vue.set(this.target.form, "bindings", {});
		}
		if (!this.target.form.fields) {
			Vue.set(this.target.form, "fields", []);
		}
	},
	computed: {
		definition: function() {
			
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
		},
		getParameterTypes: function(value) {
			var types = ['string', 'boolean', 'number', 'integer'];
			nabu.utils.arrays.merge(types, Object.keys(this.$services.swagger.swagger.definitions));
			if (value) {
				types = types.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			return types;
		},
	}
});
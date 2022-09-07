nabu.page.provide("page-renderer", {
	title: "Form",
	name: "form",
	type: ["row", "cell"],
	component: "renderer-form",
	configuration: "renderer-form-configure",
	// can inject state into the page so we can manipulate it
	getState: function(container, page, pageParameters, $services) {
		if (container.form) {
			if (container.form.array && container.form.formType == "array") {
				var array = container.form.array;
				if (array.indexOf("page.") == 0) {
					array = array.substring("page.".length);
				}
				var childDefinition = $services.page.getChildDefinition({properties:pageParameters}, array);
				return childDefinition && childDefinition.items && childDefinition.items ? childDefinition.items : {};
			}
			else if (container.form.operation && container.form.formType == "operation") {
				var operationId = container.form.operation;
				return application.services.page.getSwaggerOperationInputDefinition(operationId);
			}
			else if (container.form.formType == "function" && container.form.function) {
				return $services.page.getFunctionInput(container.form.function);
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
	// TODO: add the output definition!
	getActions: function(container) {
		var actions = [];
		actions.push({
			title: "Validate",
			name: "validate"
		});
		if (container && container.form && (container.form.operation || container.form.function || (container.form.fields && container.form.fields.length > 0))) {
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
		parameters: {
			type: Object,
			required: false
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
	computed: {
		mode: function() {
			return !this.cell.state.noInlineErrors ? "component" : null;
		}
	},
	created: function() {
		var self = this;
		if (this.parameters) {
			Object.keys(this.parameters).forEach(function(key) {
				Vue.set(self.state, key, !self.target.form.bindingByReference ? JSON.parse(JSON.stringify(self.parameters[key])) : self.parameters[key]);
				//Vue.set(self.state, key, self.parameters[key]);
			});
		}
		if (this.target.form && this.target.form.noInlineErrors) {
			this.mode = null;
		}
		else {
			this.mode = "component";
		}
		// if we have a form on an operation, we likely have a "body" in our state
		// we want to be able to pass that around by reference
		if (this.target.form && this.target.form.formType == "operation" && this.state.body == null) {
			Vue.set(this.state, "body", {});
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
			messages: [],
			state: {},
			subscriptions: [],
			mode: null
		}
	},
	methods: {
		getRuntimeState: function() {
			return this.state;		
		},
		submit: function() {
			var self = this;
			this.messages.splice(0);
			// do an operation call
			if (this.target.form.operation && this.target.form.formType == "operation") {
				return this.$services.swagger.execute(this.target.form.operation, this.state).then(function() {
					// synchronize the changes back to the binding if relevant
					if (self.target.form.synchronize) {
						self.$services.page.applyRendererParameters(self.$services.page.getPageInstance(self.page, self), self.target, self.state);
					}
				}, function(error) {
					self.error = "Form submission failed";
					// if we get an XMLHTTPResponse thingy, parse it
					if (error && error.responseText) {
						error = JSON.parse(error.responseText);
					}
					// we get a (hopefully) standardized event back
					if (error) {
						if (!error.code) {
							error.code = "HTTP-" + (error.status != null ? error.status : 500);
						}
						try {
							if (self.target.form.errorEvent) {
								var pageInstance = self.$services.page.getPageInstance(self.page, self);
								pageInstance.emit(self.target.form.errorEvent, error);
							}
							// the default says nothing
							if (error.title == "Internal Server Error") {
								error.title = "%{Could not submit your form}";
							}
							var translated = self.$services.page.translateErrorCode(error.code, error.title ? error.title : error.message);
							self.error = translated;
							self.messages.push({
								type: "request",
								severity: "error",
								title: translated
							})
						}
						catch (exception) {
							self.messages.push({
								type: "request",
								severity: "error",
								title: self.$services.page.translateErrorCode(error.status ? "HTTP-" + error.status : "HTTP-500")
							})
						}
					}
					else {
						self.messages.push({
							type: "request",
							severity: "error",
							title: self.$services.page.translateErrorCode("HTTP-500")
						});
					}
					self.doingIt = false;
					stop(self.error);
				});
			}
			else if (this.target.form.array && this.target.form.formType == "array") {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				var current = pageInstance.get(this.target.form.array);
				if (current == null) {
					pageInstance.set(this.target.form.array, []);
					current = pageInstance.get(this.target.form.array);
				}
				current.push(this.state);
				// synchronize the changes back to the binding if relevant
				if (self.target.form.synchronize) {
					self.$services.page.applyRendererParameters(self.$services.page.getPageInstance(self.page, self), self.target, self.state);
				}
			}
			else if (this.target.form.function && this.target.form.formType == "function") {
				var func = this.$services.page.getRunnableFunction(this.target.form.function);
				if (!func) {
					throw "Could not find function: " + this.target.form.function; 
				}
				var promise = this.$services.q.defer();
				var result = this.$services.page.runFunction(func, this.state, this, promise);
				
				// synchronize the changes back to the binding if relevant
				if (self.target.form.synchronize) {
					promise.then(function(x) {
						self.$services.page.applyRendererParameters(self.$services.page.getPageInstance(self.page, self), self.target, self.state);
					})
				}
				
				// not yet used
				if (this.target.form.functionOutputEvent && false) {
					var def = this.$services.page.getFunctionDefinition(this.target.form.function);
					var pageInstance = this.$services.page.getPageInstance(this.page, this);
					if (def.async) {
						promise.then(function(asyncResult) {
							pageInstance.emit(self.target.form.functionOutputEvent, asyncResult ? asyncResult : {});
						});
					}
					else {
						pageInstance.emit(this.target.form.functionOutputEvent, result ? result : {});
					}
				}
				return promise;
			}
			else if (this.target.form.fields && this.target.form.fields.length && this.target.form.formType == "page") {
				this.$services.page.applyRendererParameters(this.$services.page.getPageInstance(this.page, this), this.target, this.state);
			}
		},
		runAction: function(name, input) {
			var self = this;
			if (name == "submit") {
				var promise = this.$services.q.defer();
				this.runAction("validate").then(function() {
					var result = self.submit();
					if (result && result.then) {
						result.then(promise, promise);
					}
					else {
						promise.resolve();
					}
				}, promise);
				return promise;
			}
			else if (name == "validate") {
				// you can set a custom component group to only validate those particular elements?
				var componentGroup = this.target.form.componentGroup ? this.target.form.componentGroup : "default";
				var promises = [];
				var messages = [];
				this.$el.querySelectorAll("[component-group='" + componentGroup + "']").forEach(function(x) {
					var result = x.__vue__.validate();
					// these are currently not compatible with the all() promises bundler... :(
					if (result && result.then) {
						var localPromise = self.$services.q.defer();
						promises.push(localPromise);
						result.then(function(x) {
							nabu.utils.arrays.merge(messages, x);
							localPromise.resolve(x);
						}, localPromise);
					}
					else if (result instanceof Array) {
						nabu.utils.arrays.merge(messages, result);
					}
				});
				var promise = this.$services.q.defer();
				this.$services.q.all(promises).then(function() {
					console.log("all promises done", promises, messages);
					if (messages.length == 0) {
						promise.resolve();
					}
					else {
						promise.reject(messages);
					}
				}, promise);
				return promise;
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
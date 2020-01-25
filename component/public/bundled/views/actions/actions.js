if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

nabu.page.views.PageActions = Vue.component("page-actions", {
	template: "#page-actions",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		},
		localState: {
			type: Object,
			required: false
		},
		actions: {
			type: Array,
			required: false
		},
		active: {
			type: String,
			required: false
		}
	},
	created: function() {
		this.normalize(this.cell.state);
		this.resolveActions();
	},
	data: function() {
		return {
			configuring: false,
			state: {},
			showing: [],
			lastAction: null,
			configuringAction: null,
			resolvedActions: [],
			subscriptions: []
		}
	},
	beforeDestroy: function() {
		this.subscriptions.splice(0).map(function(x) {
			x();
		});
	},
	ready: function() {
		var self = this;
		if (this.active || this.cell.state.defaultAction) {
			var action = this.cell.state.actions.filter(function(action) {
				// the new match
				return (action.name == (self.active ? self.active : self.cell.state.defaultAction))
				// backwards compatible matching
					|| (action.label == (self.active ? self.active : self.cell.state.defaultAction));
			})[0];
			if (action) {
				this.handle(action, true);
			}
		}
		var self = this;
		var pageInstance = self.$services.page.getPageInstance(self.page, self);
		
		this.getActions().forEach(function(action) {
			if (action.triggers) {
				action.triggers.forEach(function(trigger) {
					self.subscriptions.push(pageInstance.subscribe(trigger, function() {
						// we need to check that the action is not hidden or if we explicitly allow hidden actions to be triggered
						if (action.triggerIfHidden || self.isVisible(action)) {
							self.handle(action, true);
						}
					}));
				})
			}
		});
	},
	methods: {
		validatableItems: function(value) {
			var values = [];
			var elements = document.getElementsByTagName("form");
			if (elements) {
				for (var i = 0; i < elements.length; i++) {
					var id = elements[i].getAttribute("id");
					if (id) {
						values.push(id);
					}
				}
			}
			if (value) {
				values = values.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			if (values.indexOf(value) < 0) {
				values.unshift(value);
			}
			return values;
		},
		addStyle: function(action) {
			if (!action.styles) {
				Vue.set(action, "styles", []);
			}
			action.styles.push({
				class: null,
				condition: null
			});
		},
		getEvents: function(actions, result) {
			var self = this;
			if (!result) {
				result = {};
			}
			if (!actions) {
				actions = this.cell.state.actions;
			}
			actions.forEach(function(action) {
				if (action.event && action.event != "$close") {
					if (action.dynamic) {
						if (action.operation) {
							result[action.event] = self.getOperationDefinition(action);
						}
					}
					// backwards compatible, should not be necessary anymore
					else if (typeof(action.event) == "string" && (action.eventState || action.eventFixedState)) {
						result[action.event] = {
							properties: {
								value: {
									type: "string"
								},
								// the sequence of the event
								sequence: {
									type: "integer"
								},
								// the amount of events (works with the sequence)
								length: {
									type: "integer"
								}
							}
						};
					}
					else if (nabu.page.event.getName(action, "event") && nabu.page.event.getName(action, "event") != "$close") {
						var type = nabu.page.event.getType(action, "event");
						if (type.properties && Object.keys(type.properties).length == 0 && self.cell.on) {
							type = self.cell.on;
						}
						result[nabu.page.event.getName(action, "event")] = type;
					}
				}
				if (action.actions) {
					self.getEvents(action.actions, result);
				}
				if (action.validationErrorEvent) {
					result[action.validationErrorEvent] = {
						type: "array", 
						items: {
							type: "object",
							properties: {
								code: { type: "string" },
								severity: { type: "string" },
								title: { type: "string" },
								priority: { type: "integer", format: "int64" },
								soft: { type: "boolean" }
							}
						}
					}
				}
			});
			return result;
		},
		resolveActions: function() {
			var promises = [];
			var self = this;
			// need new array
			nabu.utils.arrays.merge(this.resolvedActions, this.actions ? this.actions : this.cell.state.actions);
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			this.resolvedActions.forEach(function(action) {
				if (action.dynamic) {
					if (action.operation) {
						var parameters = {};
						// bind additional stuff from the page
						Object.keys(action.bindings).forEach(function(name) {
							if (action.bindings[name]) {
								var value = self.$services.page.getBindingValue(pageInstance, action.bindings[name]);
								if (value != null && typeof(value) != "undefined") {
									parameters[name] = value;
								}
							}
						});
						promises.push(self.$services.swagger.execute(action.operation, parameters).then(function(result) {
							var list = [];
							Object.keys(result).forEach(function(key) {
								if (result[key] instanceof Array) {
									list = result[key];
								}	
							});
							list = list.map(function(x) {
								var clone = nabu.utils.objects.clone(action);
								clone.dynamic = false;
								clone.content = x;
								clone.label = self.$services.page.getValue(x, clone.label);
								return clone;
							});
							var index = self.resolvedActions.indexOf(action);
							list.unshift(1);
							list.unshift(index);
							self.resolvedActions.splice.apply(self.resolvedActions, list);
							if (action.autotrigger && list.length > 2) {
								self.handle(list[2], true);
							}
						}));
					}
				}
			});
			return this.$services.q.all(promises);
		},
		getActions: function() {
			return this.actions ? this.actions : this.cell.state.actions;
		},
		configure: function() {
			this.configuring = true;	
		},
		normalize: function(state) {
			if (!state.class) {
				Vue.set(state, "class", null);
			}
			if (!state.actions) {
				Vue.set(state, "actions", []);
			}
			if (!state.activeClass) {
				Vue.set(state, "activeClass", null);
			}
			if (!state.disabledClass) {
				Vue.set(state, "disabledClass", null);
			}
			if (!state.pastClass) {
				Vue.set(state, "pastClass", null);
			}
			if (!state.defaultAction) {
				Vue.set(state, "defaultAction", null);
			}
			if (!state.useButtons) {
				Vue.set(state, "useButtons", false);	
			}
			state.actions.map(function(action) {
				if (!action.activeRoutes) {
					Vue.set(action, "activeRoutes", []);
				}	
			});
		},
		getDynamicClasses: function(action) {
			var classes = [];
			if (action.styles) {
				nabu.utils.arrays.merge(classes, this.$services.page.getDynamicClasses(action.styles, this.state, this));
			}
			if (action.buttonClass) {
				classes.push(action.buttonClass);
			}
			// set the active class if applicable
			var activeClass = this.cell.state.activeClass ? this.cell.state.activeClass : "is-active";
			if (this.lastAction == action && (action.route || action.url || typeof(action.event) == "string")) {
				classes.push(activeClass);
			}
			else if (this.$services.vue.route) {
				var self = this;
				if (this.$services.vue.route == action.route) {
					classes.push(activeClass);
				}
				else if (action.activeRoutes) {
					var match = action.activeRoutes.filter(function(route) {
						if (route && (route == self.$services.vue.route || self.$services.vue.route.match("^" + route + "$"))) {
							return true;
						}
					}).length > 0;
					if (match) {
						classes.push(activeClass);
					}
				}
			}
			// set the disabled class if applicable
			var disabledClass = this.cell.state.disabledClass ? this.cell.state.disabledClass : "is-disabled";
			if (this.isDisabled(action)) {
				classes.push(disabledClass);
			}
			
			// we use this to highlight steps that are already done in a wizard-like step process
			var pastClass = this.cell.state.pastClass ? this.cell.state.pastClass : "is-past";
			if (this.lastAction) {
				var lastIndex = this.resolvedActions.indexOf(this.lastAction);
				var actionIndex = this.resolvedActions.indexOf(action);
				if (actionIndex < lastIndex) {
					classes.push(pastClass);
				}
			}
			return classes;
		},
		toggle: function(action) {
			if (this.cell.state.clickBased) {
				var index = this.showing.indexOf(action);
				console.log("index is", action, index, this.showing.length);
				if (index >= 0) {
					this.showing.splice(index, 1);
				}
				else {
					if (this.cell.state.showOnlyOne) {
						this.showing.splice(0);
					}
					this.showing.push(action);
				}
			}
		},
		hide: function(action) {
			if (!this.cell.state.clickBased) {
				var index = this.showing.indexOf(action);
				if (index >= 0) {
					this.showing.splice(index, 1);
				}
			}
		},
		show: function(action) {
			if (!this.cell.state.clickBased) {
				if (this.showing.indexOf(action) < 0) {
					this.showing.push(action);
				}
			}
		},
		autoclose: function() {
			if (!this.cell.state.leaveOpen) {
				this.showing.splice(0, this.showing.length);
			}
		},
		listRoutes: function(value, includeValue) {
			if (value != null && value.substring(0, 1) == "=") {
				return [value];
			}
			var routes = this.$services.router.list().map(function(x) { return x.alias });
			if (value) {
				routes = routes.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			routes.sort();
			if (value && includeValue) {
				routes.unshift(value);
			}
			return routes;
		},
		addContent: function() {
			this.getActions().push({
				arbitrary: true,
				name: null,
				class: null,
				content: {}
			});
		},
		addAction: function(dynamic) {
			this.getActions().push({
				dynamic: dynamic,
				operation: null,
				label: "Action" + (this.getActions().length + 1),
				route: null,
				event: null,
				eventState: null,
				eventFixedState: null,
				hasFixedState: false,
				anchor: null,
				mask: false,
				condition: null,
				disabled: null,
				bindings: {},
				actions: [],
				icons: null,
				activeRoutes: [],
				class: null,
				buttonClass: null
			});
		},
		isVisible: function(action) {
			return this.edit || !action.condition || this.$services.page.isCondition(action.condition, this.state, this);
		},
		isDisabled: function(action) {
			return action.disabled && this.$services.page.isCondition(action.disabled, this.state, this);
		},
		getActionHref: function(action) {
			if (!this.cell.state.useButtons && action.url) {
				return this.$services.page.interpret(action.url, this);
			}
			if (action.absolute && action.route) {
				var route = action.route;
				if (route.charAt(0) == "=") {
					route = this.$services.page.interpret(route, this);
				}
				var parameters = {};
				var self = this;
				var pageInstance = self.$services.page.getPageInstance(this.page, this);
				Object.keys(action.bindings).map(function(key) {
					if (action.bindings[key] != null) {
						var value = self.$services.page.getBindingValue(pageInstance, action.bindings[key], self);
						// the old way... should disable it?
						if (value == null) {
							var parts = action.bindings[key].split(".");
							var value = self.state;
							parts.map(function(part) {
								if (value) {
									value = value[part];
								}
							});
							if (value) {
								parameters[key] = value;
							}
						}
						if (value != null) {
							parameters[key] = value;
						}
					}
				});
				var url = this.$services.router.template(route, parameters);
				if (action.absolute) {
					// in multi-domain situations the fixed environment url is not always correct
					//url = "${when(environment('secure'), 'https', 'http')}://" + window.location.host + url;
					url = window.location.protocol + "//" + window.location.host + url;
					//url = "${environment('url')}" + url;
				}
				return url;
			}
			return "javascript:void(0)";
		},
		validateTarget: function(target) {
			var element = document.getElementById(target);
			var elements = [];
			if (element && element.__vue__ && element.__vue__.validate) {
				elements.push(element);
			}
			else {
				var forms = document.body.querySelectorAll("[component-group='" + target + "']");
				if (forms && forms.length) {
					for (var i = 0; i < forms.length; i++) {
						elements.push(forms.item(i));
					}
				}
			}
			var self = this;
			var promises = elements.map(function(x) {
				return self.validateSingle(x);
			}).filter(function(x) {
				return x != null;
			});
			var promise = null;
			if (promises.length) {
				promise = this.$services.q.all(promises);
			}
			else {
				promise = this.$services.q.defer();
				promise.resolve();
			}
			promise.then(function() {
				elements.forEach(function(element) {
					if (element.__vue__.$parent.doIt) {
						element.__vue__.$parent.doIt();
					}
				});
			});
			return promise;
		},
		getValidationResults: function(promiseResult) {
			console.log("validation results are", promiseResult);
			var messages = [];
			promiseResult.forEach(function(x) {
				nabu.utils.arrays.merge(messages, x);
			});
			return messages;
		},
		validateSingle: function(element) {
			if (element && element.__vue__ && element.__vue__.validate) {
				var result = element.__vue__.validate();
				var promise = this.$services.q.defer();
				if (result.then) {
					result.then(function(x) {
						if (x && x.length) {
							promise.reject(x);
						}
						else {
							promise.resolve([]);
						}
					});
				}
				else {
					if (result.length) {
						promise.reject(result);
					}
					else {
						promise.resolve(result);
					}
				}
				return promise;
			}
			return null;
		},
		handle: function(action, force) {
			if (action.name && this.$services.analysis && this.$services.analysis.emit) {
				this.$services.analysis.emit("trigger-" + (this.cell.state.analysisId ? this.cell.state.analysisId : "action"), action.name, {url: window.location}, true);
			}
			// we must validate some target before we can proceed
			if (action.validate && !force) {
				var self = this;
				this.validateTarget(action.validate).then(function(x) {
					self.handle(action, true);
				}, function(x) {
					var messages = self.getValidationResults(x);
					if (action.validationErrorScroll) {
						var elementToFocus = messages.filter(function(x) {
							return !!x.component;
						})[0];
						if (elementToFocus) {
							elementToFocus.scrollIntoView();
							elementToFocus.focus();
						}
					}
					if (action.validationErrorEvent) {
						var pageInstance = self.$services.page.getPageInstance(self.page, self);
						pageInstance.emit(action.validationErrorEvent, { messages: messages });
					}
				});
				return null;
			}
			// we already have a valid href on there, no need to do more
			if (!this.cell.state.useButtons && action.route && action.absolute) {
				return;
			}
			else if (!this.cell.state.useButtons && action.url) {
				return;
			}
			if (force || !this.isDisabled(action)) {
				if (action.route) {
					var route = action.route;
					if (route.charAt(0) == "=") {
						route = this.$services.page.interpret(route, this);
					}
					var parameters = {};
					var self = this;
					var pageInstance = self.$services.page.getPageInstance(this.page, this);
					Object.keys(action.bindings).map(function(key) {
						if (action.bindings[key] != null) {
							var value = self.$services.page.getBindingValue(pageInstance, action.bindings[key], self);
							// the old way... should disable it?
							if (value == null) {
								var parts = action.bindings[key].split(".");
								var value = self.state;
								parts.map(function(part) {
									if (value) {
										value = value[part];
									}
								});
								if (value) {
									parameters[key] = value;
								}
							}
							if (value != null) {
								parameters[key] = value;
							}
						}
					});
					if (action.anchor == "$blank") {
						window.open(self.$services.router.template(route, parameters));
					}
					else if (action.anchor == "$window") {
						window.location = self.$services.router.template(route, parameters);
					}
					else {
						this.$services.router.route(route, parameters, action.anchor, action.mask);
					}
				}
				else if (action.url) {
					var url = this.$services.page.interpret(action.url, this);
					if (action.anchor) {
						window.open(url);
					}
					else {
						window.location = url;
					}
				}
				else if (action.event == "$close" || nabu.page.event.getName(action, "event") == "$close") {
					this.$emit("close");
				}
				else if (action.event) {
					// if you are working event-based, you are using events to show parts of the screen
					// currently we assume only one event should be "active" at a time, so we unset all other events this tab provider can emit
					this.unsetEvent(this.cell.state.actions);
					
					var self = this;
					var pageInstance = self.$services.page.getPageInstance(self.page, self);
					var content = null;
					var addDefaults = false;
					var eventName = null;
					// backwards compatible
					if (typeof(action.event) == "string") {
						eventName = action.event;
						if (action.hasFixedState && action.eventFixedState) {
							content = {
								value: this.$services.page.interpret(action.eventFixedState, this)
							}
							addDefaults = true;
						}
						else if (action.content) {
							content = action.content;
						}
						else if (action.eventState) {
							content = {
								value: pageInstance.get(action.eventState)
							}
							addDefaults = true;
						}
					}
					else if (action.event) {
						eventName = nabu.page.event.getName(action, "event");
						// you have a custom event
						if (action.event.eventFields && action.event.eventFields.length) {
							content = nabu.page.event.getInstance(action, "event", this.page, this);
						}
						else if (action.content) {
							content = action.content;
						}
						else if (this.cell.on) {
							content = pageInstance.get(this.cell.on);
						}
					}
					if (addDefaults) {
						content.sequence = this.resolvedActions.indexOf(action) + 1;
						content.length = this.resolvedActions.length;
						content.actor = this.cell.id;
					}
					pageInstance.emit(eventName, content ? content : {});
					this.lastAction = action;
				}
				if (action.close) {
					this.$emit("close");
				}
			}
		},
		unsetEvent: function(actions) {
			var self = this;
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			actions.map(function(action) {
				if (action.event) {
					pageInstance.reset(action.event);
				}
				if (action.actions) {
					self.unsetEvent(action.actions);
				}
			});
		},
		configureAction: function(action) {
			this.configuringAction = action;
			var self = this;
			// give it time to render and resolve the $ref
			Vue.nextTick(function() {
				var key = "action_" + self.getActions().indexOf(action);
				self.$refs[key][0].configure();
			});
		},
		up: function(action) {
			var actions = this.getActions();
			var index = actions.indexOf(action);
			if (index > 0) {
				var replacement = actions[index - 1];
				actions.splice(index - 1, 1, actions[index]);
				actions.splice(index, 1, replacement);
			}
		},
		down: function(action) {
			var actions = this.getActions();
			var index = actions.indexOf(action);
			if (index < actions.length - 1) {
				var replacement = actions[index + 1];
				actions.splice(index + 1, 1, actions[index]);
				actions.splice(index, 1, replacement);
			}
		},
		
		// copy paste from data component => datautils getdatoperations
		getActionOperations: function(name) {
			var self = this;
			return this.$services.page.getOperations(function(operation) {
				// must be a get
				var isAllowed = operation.method.toLowerCase() == "get"
					// and contain the name fragment (if any)
					&& (!name || operation.id.toLowerCase().indexOf(name.toLowerCase()) >= 0)
					// must have _a_ response
					&& operation.responses["200"];
				// we also need at least _a_ complex array in the results
				if (isAllowed && operation.responses["200"] != null && operation.responses["200"].schema != null) {
					var schema = operation.responses["200"].schema;
					var definition = self.$services.swagger.definition(schema["$ref"]);
					isAllowed = false;
					if (definition.properties) {
						Object.keys(definition.properties).map(function(field) {
							if (definition.properties[field].type == "array") {
								isAllowed = true;
							}
						});
					}
				}
				return isAllowed;
			}).map(function(x) { return x.id });
		},
		getInputParameters: function(action) {
			var result = {
				properties: {}
			};
			var self = this;
			var operation = this.$services.swagger.operations[action.operation];
			if (operation && operation.parameters) {
				var blacklist = ["limit", "offset", "orderBy", "connectionId"];
				var parameters = operation.parameters.filter(function(x) {
					return blacklist.indexOf(x.name) < 0;
				}).map(function(x) {
					result.properties[x.name] = self.$services.swagger.resolve(x);
				})
			}
			return result;
		},
		getOperationDefinition: function(action) {
			var properties = {};
			var operation = this.$services.swagger.operations[action.operation];
			if (operation && operation.responses["200"]) {
				var definition = this.$services.swagger.resolve(operation.responses["200"].schema);
				//var definition = this.$services.swagger.definition(schema["$ref"]);
				if (definition.properties) {
					var self = this;
					Object.keys(definition.properties).forEach(function(field) {
						if (definition.properties[field].type == "array") {
							var items = definition.properties[field].items;
							if (items.properties) {
								nabu.utils.objects.merge(properties, items.properties);
							}
						}
					});
				}
			}
			return {properties:properties};
		},
		getOperationProperties: function(action) {
			return this.$services.page.getSimpleKeysFor(this.getOperationDefinition(action));
		}
	}
});


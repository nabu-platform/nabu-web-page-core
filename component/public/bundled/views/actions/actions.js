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
	},
	data: function() {
		return {
			configuring: false,
			state: {},
			showing: [],
			lastAction: null,
			configuringAction: null
		}
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
	},
	methods: {
		getEvents: function(actions, result) {
			var self = this;
			if (!result) {
				result = {};
			}
			if (!actions) {
				actions = this.cell.state.actions;
			}
			actions.map(function(action) {
				if (action.event && action.event != "$close") {
					if (action.eventState || action.eventFixedState) {
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
					else {
						result[action.event] = self.cell.on ? self.cell.on : {};
					}
				}
				if (action.actions) {
					self.getEvents(action.actions, result);
				}
			});
			return result;
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
			if (action.buttonClass) {
				classes.push(action.buttonClass);
			}
			// set the active class if applicable
			var activeClass = this.cell.state.activeClass ? this.cell.state.activeClass : "is-active";
			if (this.lastAction == action) {
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
				var lastIndex = this.getActions().indexOf(this.lastAction);
				var actionIndex = this.getActions().indexOf(action);
				if (actionIndex < lastIndex) {
					classes.push(pastClass);
				}
			}
			return classes;
		},
		hide: function(action) {
			var index = this.showing.indexOf(action);
			if (index >= 0) {
				this.showing.splice(index, 1);
			}
		},
		show: function(action) {
			if (this.showing.indexOf(action) < 0) {
				this.showing.push(action);
			}
		},
		listRoutes: function(value, includeValue) {
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
		addAction: function() {
			this.getActions().push({
				label: null,
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
		handle: function(action, force) {
			if (force || !this.isDisabled(action)) {
				if (action.route) {
					var route = action.route;
					if (route.charAt(0) == "=") {
						route = this.$services.page.interpret(route, this);
					}
					var parameters = {};
					var self = this;
					Object.keys(action.bindings).map(function(key) {
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
					});
					this.$services.router.route(route, parameters, action.anchor, action.mask);
				}
				else if (action.event == "$close") {
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
					if (action.hasFixedState && action.eventFixedState) {
						content = {
							value: action.eventFixedState
						}
						addDefaults = true;
					}
					else if (action.eventState) {
						content = {
							value: pageInstance.get(action.eventState)
						}
						addDefaults = true;
					}
					else if (this.cell.on) {
						content = pageInstance.get(this.cell.on);
					}
					if (addDefaults) {
						content.sequence = this.getActions().indexOf(action) + 1;
						content.length = this.getActions().length;
						content.actor = this.cell.id;
					}
					pageInstance.emit(action.event, content ? content : {});
					this.lastAction = action;
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
		}
	}
});

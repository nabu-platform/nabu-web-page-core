nabu.page.provide("page-renumberer", {
	component: "page-button",
	renumber: function(target, mapping) {
		// update the action target
		if (target.state.actionTarget != null && mapping[target.state.actionTarget] != null) {
			target.state.actionTarget = mapping[target.state.actionTarget];	
		}
	}
});

Vue.view("page-button", {
	props: {
		page: {
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
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},  
	name: "Button",
	category: "Interactive",
	description: "A button to send out events, go to a different page,...",
	icon: "link",
	data: function() {
		return {
			timer: null,
			running: false,
			activated: false
		}
	},
	created: function() {
		this.elementPromise = this.$services.q.defer();
	},
	computed: {
		active: function() {
			var active = false;
			if (this.cell.state.active) {
				active = this.$services.page.isCondition(this.cell.state.active, null, this);
			}
			return active || this.$services.triggerable.getActiveRoutes(this.cell.state).indexOf(this.$services.vue.route) >= 0;
		},
		disabled: function() {
			return this.cell.state.disabled && this.$services.page.isCondition(this.cell.state.disabled, null, this);
		}
	},
	ready: function() {
		this.elementPromise.resolve(this.$el);	
		if (this.cell.state.activateByDefault) {
			this.handle();
		}
	},
	methods: {
		getContentWithVariables: function(content) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			return !content ? content : this.$services.typography.replaceVariables(pageInstance, this.cell.state, content, this.elementPromise);
		},
		getChildComponents: function() {
			return [{
				title: "Button",
				name: "page-button",
				component: "button"
			}]	
		},
		getEvents: function() {
			var result = {};
			nabu.utils.objects.merge(result, this.$services.triggerable.getEvents(this.page, this.cell.state));

			if (nabu.page.event.getName(this.cell.state, "clickEvent") && nabu.page.event.getName(this.cell.state, "clickEvent") != "$close") {
				var type = nabu.page.event.getType(this.cell.state, "clickEvent");
				result[nabu.page.event.getName(this.cell.state, "clickEvent")] = type;
			}
			if (this.cell.state.action && this.cell.state.actionTarget && this.cell.state.actionEvent) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				var output = this.$services.page.getActionOutput(pageInstance, this.cell.state.actionTarget, this.cell.state.action);
				// we may just want marker events without output
				result[this.cell.state.actionEvent] = output ? {properties:output} : {};
			}
			return result;
		},
		handle: function($event) {
			// if you are in edit mode, you have to explicitly click alt to enable the button
			// it seems that vue also intercepts spaces and sends it as a click event, meaning when you type in the rich text, it can trigger
			if (!this.edit || $event.altKey) {
				// if we are part of a component group, we will first untrigger any existing active component group buttons
				// we rather have an intermittent situation where no buttons are active than where two buttons are active
				if (this.cell.state.componentGroup) {
					document.querySelectorAll("[component-group='" + this.cell.state.componentGroup + "']").forEach(function(x) {
						if (x.__vue__) {
							if (x.__vue__.deactivate) {
								x.__vue__.deactivate();
							}
						}	
					});
				}
				
				this.running = true;
				var promise = this.$services.triggerable.trigger(this.cell.state, "click", null, this);
				
				if (this.cell.state.stopPropagation && $event) {
					$event.stopPropagation();
					$event.preventDefault();
				}
				
				var self = this;
				var unlock = function() {
					self.running = false;
					if (self.cell.state.emitClose) {
						self.$emit("close");
					}
					if (self.cell.state.componentGroup) {
						self.activated = true;
					}
				}
				promise.then(unlock, unlock);
				
				return promise;
			}
			
			// we don't always call this handler (immediately), so we separate the logic
			var self = this;
			
			var getBindings = function() {
				var parameters = {};
				var pageInstance = self.$services.page.getPageInstance(self.page, self);
				Object.keys(self.cell.state.bindings).map(function(key) {
					if (self.cell.state.bindings[key] != null) {
						var value = self.$services.page.getBindingValue(pageInstance, self.cell.state.bindings[key], self);
						if (value != null) {
							parameters[key] = value;
						}
					}
				});
				return parameters;
			}
			var handler = function() {
				// event-based
				if (nabu.page.event.getName(self.cell.state, "clickEvent")) {
					var pageInstance = self.$services.page.getPageInstance(self.page, self);
					return pageInstance.emit(
						nabu.page.event.getName(self.cell.state, "clickEvent"),
						nabu.page.event.getInstance(self.cell.state, "clickEvent", self.page, self)
					);
				}
				// route based
				else if (self.cell.state.route) {
					var route = self.cell.state.route;
					// variable route possible
					if (route.charAt(0) == "=") {
						route = self.$services.page.interpret(route, self);
					}
					var parameters = getBindings();
					if (self.cell.state.anchor == "$blank") {
						window.open(self.$services.router.template(route, parameters));
					}
					else if (self.cell.state.anchor == "$window") {
						window.location = self.$services.router.template(route, parameters);
					}
					else {
						return self.$services.router.route(route, parameters, self.cell.state.anchor, self.cell.state.mask);
					}
				}
				else if (self.cell.state.url) {
					var url = this.$services.page.interpret(self.cell.state.url, this);
					if (self.cell.state.anchor == "$blank") {
						window.open(url);
					}
					else {
						window.location = url;
					}
				}
				// we might want to run an action
				else if (self.cell.state.action) {
					if (self.cell.state.actionTarget) {
						var pageInstance = self.$services.page.getPageInstance(self.page, self);
						var target = self.$services.page.getActionTarget(pageInstance, self.cell.state.actionTarget);
						// at this point it is a renderer or a component
						if (target && target.runAction) {
							var result = target.runAction(self.cell.state.action, getBindings());
							var promise = self.$services.q.defer();
							// if we want to emit an action event, let's, even if the result is null
							if (self.cell.state.actionEvent) {
								if (result && result.then) {
									// we don't do anything (yet) on error?
									result.then(function(x) {
										pageInstance.emit(self.cell.state.actionEvent, x);
										promise.resolve();
									}, promise);
								}
								else {
									pageInstance.emit(self.cell.state.actionEvent, result).then(promise, promise);
								}
							}
							else {
								promise.resolve();
							}
							return promise;
						}
					}
				}
			};
			if (!this.edit) {
				var unlock = function() {
					self.running = null;
					if (self.cell.state.emitClose) {
						self.$emit("close");
					}
					if (self.cell.state.componentGroup) {
						self.activated = true;
					}
				};
				this.running = true;
				var promise = handler();
				if (promise && promise.then) {
					promise.then(unlock, unlock);
				}
				else {
					unlock();
				}
			}
			if (this.cell.state.stopPropagation) {
				$event.stopPropagation();
				$event.preventDefault();
			}
		},
		deactivate: function() {
			if (this.activated) {
				this.$services.triggerable.untrigger(this.cell.state, "click", this);
				this.activated = false;	
			}
		},
		configurator: function() {
			return "page-button-configure";
		},
		update: function() {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			var self = this;
			if (this.$refs.editor) {
				var last = self.$refs.editor.innerHTML;
				this.timer = setTimeout(function() {
					self.cell.state.content = nabu.utils.elements.sanitize(self.$refs.editor ? self.$refs.editor.innerHTML : last);
				}, 100);
			}
		}
	}
});

Vue.component("page-button-configure", {
	template: "#page-button-configure",
	props: {
		page: {
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
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	created: function() {
		if (!this.cell.state.bindings) {
			Vue.set(this.cell.state, "bindings", {});
		}
		// otherwise not reactive...?
		if (!this.cell.state.actionTarget) {
			Vue.set(this.cell.state, "actionTarget", null);
		}
		if (!this.cell.state.activeRoutes) {
			Vue.set(this.cell.state, "activeRoutes", []);
		}
	},
	watch: {
		'cell.state.activateByDefault': function(newValue) {
			// disable this in others from the same group
			if (newValue) {
				var self = this;
				document.querySelectorAll("[component-group='" + this.cell.state.componentGroup + "']").forEach(function(x) {
					if (x.__vue__ && x.__vue__.cell.id != self.cell.id) {
						Vue.set(x.__vue__.cell.state, "activateByDefault", false);
					}
				});
			}
		}
	}
});
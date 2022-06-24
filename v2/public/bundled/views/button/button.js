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
			running: false
		}
	},
	created: function() {
		this.elementPromise = this.$services.q.defer();
	},
	ready: function() {
		this.elementPromise.resolve(this.$el);	
	},
	computed: {
		active: function() {
			return this.$services.triggerable.getActiveRoutes(this.cell.state).indexOf(this.$services.vue.route) >= 0;
		},
		disabled: function() {
			return this.cell.state.disabled && this.$services.page.isCondition(this.cell.state.disabled, null, this);
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
			if (!this.edit || !$event.ctrlKey) {
				var promise = this.$services.triggerable.trigger(this.cell.state, "click", null, this);
				
				if (this.cell.state.stopPropagation) {
					$event.stopPropagation();
					$event.preventDefault();
				}
				
				this.running = true;
				var self = this;
				var unlock = function() {
					self.running = false;
					if (self.cell.state.emitClose) {
						self.$emit("close");
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
	}
});
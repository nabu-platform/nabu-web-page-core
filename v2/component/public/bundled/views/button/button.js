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
		// click was renamed to activate
		// for the forseeable future we do this rewriting
		// might disable it at some point
		if (this.cell.state.triggers) {
			this.cell.state.triggers.forEach(function(x) {
				if (x.trigger == "click") {
					x.trigger = "activate";
				}
			})
		}
	},
	computed: {
		tooltip: function() {
			if (this.cell.state.tooltip) {
				return this.$services.page.interpret(this.$services.page.translate(this.cell.state.tooltip), this);
			}	
		},
		badge: function() {
			if (this.cell.state.badge) {
				return this.$services.page.interpret(this.$services.page.translate(this.cell.state.badge), this);
			}	
		},
		active: function() {
			var active = false;
			var self = this;
			if (this.activationType == "route") {
				if (this.cell.state.activeRoutes && this.cell.state.activeRoutes.length) {
					var activeRoutes = this.cell.state.activeRoutes.filter(function(x) {
						if (x.route == self.$services.vue.route) {
							return !x.condition
								|| self.$services.page.isCondition(x.condition, self.$services.vue.parameters, self, function(value) {
									return self.$services.page.getValue(self.$services.vue.parameters, value);
								});
						}
						return false;
					});
					return activeRoutes.length > 0;
				}
				return this.$services.triggerable.getActiveRoutes(this.cell.state).indexOf(this.$services.vue.route) >= 0;
			}
			else if (this.activationType == "condition" && this.cell.state.active) {
				return this.$services.page.isCondition(this.cell.state.active, null, this);
			}
			else if (this.activationType == "group") {
				// todo?
			}
		},
		disabled: function() {
			return this.cell.state.disabled ? this.$services.page.isCondition(this.cell.state.disabled, null, this) : false;
		},
		activationType: function() {
			var activationType = this.cell.state.activationType;
			if (!this.cell.state.hasOwnProperty("activationType")) {
				// we have group-based activation
				if (this.cell.state.componentGroup) {
					activationType = "group";
				}
				else if (this.cell.state.active) {
					activationType = "condition";
				}
				// by default we use route-based activation
				else {
					activationType = "route";
				}
			}
			return activationType;
		}
	},
	ready: function() {
		this.elementPromise.resolve(this.$el);	
		if (this.cell.state.activateByDefault) {
			this.handle();
		}
		if (this.cell.state.activeInitial) {
			if (this.$services.page.isCondition(this.cell.state.activeInitial, null, this)) {
				this.handle();
			}
		}
	},
	methods: {
		guessButtonType: function() {
			var isSubmit = false;
			if (this.cell.state.triggers) {
				this.cell.state.triggers.forEach(function(trigger) {
					if (trigger.actions) {
						trigger.actions.forEach(function(action) {
							if (action.type == "action" && action.action == 'submit') {
								isSubmit = true;
							}
						});
					}
				})
			}
			return isSubmit ? "submit" : "button";
		},
		getContentWithVariables: function(content) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			return !content ? content : this.$services.typography.replaceVariables(pageInstance, this.cell.state, content, this.elementPromise);
		},
		getChildComponents: function() {
			var childComponents = [{
				title: "Button",
				name: "page-button",
				component: "button"
			}];
			if (this.cell.state.badge) {
				childComponents.push({
					title: "Badge",
					name: "page-button-badge",
					component: "badge"
				});
			}
			return childComponents;
		},
		getEvents: function() {
			var result = {};
			nabu.utils.objects.merge(result, this.$services.triggerable.getEvents(this.page, this.cell.state));

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
			if (!this.edit || ($event && $event.altKey)) {
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
				var promise = this.$services.triggerable.trigger(this.cell.state, "activate", null, this);
				
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
		},
		deactivate: function() {
			if (this.activated) {
				this.$services.triggerable.untrigger(this.cell.state, "activate", this);
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
		// for older buttons, we need to calculate what we need
		if (!this.cell.state.hasOwnProperty("activationType")) {
			// we have group-based activation
			if (this.cell.state.componentGroup) {
				Vue.set(this.cell.state, "activationType", "group");
			}
			else if (this.cell.state.active) {
				Vue.set(this.cell.state, "activationType", "condition");
			}
			// by default we use route-based activation
			else {
				Vue.set(this.cell.state, "activationType", "route");
			}
		}
	},
	computed: {
		triggers: function() {
			// we can activate
			var triggers = {"activate": {}};
			if (this.cell.state.triggers) {
				if (this.cell.state.triggers.map(function(x) {
						return x.trigger;
					}).indexOf("activate") >= 0) {
					triggers.deactivate = {};	
				}
			}
			return triggers;
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
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
	methods: {
		getChildComponents: function() {
			return [{
				title: "Button",
				name: "page-button",
				component: "button"
			}]	
		},
		handle: function($event) {
			// we don't always call this handler (immediately), so we separate the logic
			var self = this;
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
					if (self.cell.state.anchor == "$blank") {
						window.open(self.$services.router.template(route, parameters));
					}
					else if (self.cell.state.anchor == "$window") {
						window.location = self.$services.router.template(route, parameters);
					}
					else {
						self.$services.router.route(route, parameters, self.cell.state.anchor, self.cell.state.mask);
					}
				}
				if (self.cell.state.close) {
					self.$emit("close");
				}
			};
			if (!this.edit) {
				var unlock = function() {
					self.running = null;
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
			var last = self.$refs.editor.innerHTML;
			this.timer = setTimeout(function() {
				self.cell.state.content = nabu.utils.elements.sanitize(self.$refs.editor ? self.$refs.editor.innerHTML : last);
			}, 100);
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
	}
})
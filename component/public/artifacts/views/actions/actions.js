if (!nabu) { var nabu = {} }
if (!nabu.views) { nabu.views = {} }
if (!nabu.views.cms) { nabu.views.cms = {} }

nabu.views.cms.PageActions = Vue.component("page-actions", {
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
		}
	},
	created: function() {
		this.normalize(this.cell.state);
	},
	data: function() {
		return {
			configuring: false,
			state: {},
			showing: []
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
				if (action.event) {
					result[action.event] = self.cell.on ? self.cell.on : {};
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
		listRoutes: function(value) {
			var routes = this.$services.router.list().map(function(x) { return x.alias });
			if (value) {
				routes = routes.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			routes.sort();
			return routes;
		},
		addAction: function() {
			this.getActions().push({
				label: null,
				route: null,
				event: null,
				anchor: null,
				mask: false,
				condition: null,
				bindings: {},
				actions: [],
				icons: null,
				class: null
			});
		},
		isVisible: function(action) {
			return this.edit || !action.condition || this.$services.page.isCondition(action.condition, this.state);
		},
		handle: function(action) {
			if (action.route) {
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
				this.$services.router.route(action.route, parameters, action.anchor, action.mask);
			}
			else if (action.event) {
				// if you are working event-based, you are using events to show parts of the screen
				// currently we assume only one event should be "active" at a time, so we unset all other events this tab provider can emit
				this.unsetEvent(this.cell.state.actions);
				
				var pageInstance = this.$services.page.instances[this.page.name];
				var content = this.cell.on ? pageInstance.get(this.cell.on) : null;
				pageInstance.emit(action.event, content ? content : {});
			}
		},
		unsetEvent: function(actions) {
			var pageInstance = this.$services.page.instances[this.page.name];
			var self = this;
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
			var key = "action_" + this.getActions().indexOf(action);
			this.$refs[key][0].configure();
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
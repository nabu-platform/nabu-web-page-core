if (!nabu) { var nabu = {} }
if (!nabu.views) { nabu.views = {} }
if (!nabu.views.cms) { nabu.views.cms = {} }

nabu.views.cms.PageTabs = Vue.component("page-tabs", {
	template: "#page-tabs",
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
		listRoutes: function() {
			var routes = this.$services.router.list().map(function(x) { return x.alias });
			routes.sort();
			return routes;
		},
		addAction: function() {
			this.getActions().push({
				label: null,
				route: null,
				anchor: null,
				mask: false,
				condition: null,
				bindings: {},
				actions: []
			});
		},
		isVisible: function(action) {
			return this.edit || true;
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
		},
		configureAction: function(action) {
			var key = "action_" + this.getActions().indexOf(action);
			this.$refs[key][0].configure();
		}
	}
});
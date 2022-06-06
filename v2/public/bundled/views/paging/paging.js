Vue.view("page-paging", {
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
		childComponents: {
			type: Object,
			required: false
		}
	},
	name: "Paging",
	category: "Data Utilities",
	icon: "sort-numeric-down",
	data: function() {
		return {
			// we don't use vue.set, so we need to specifically define the fields
			paging: {
				total: 0,
				current: 0
			},
			component: null
		}
	},
	// hook into component
	mounted: function() {
		var self = this;
		var pageInstance = this.$services.page.getPageInstance(this.page, this);
		if (this.cell.state.target) {
			pageInstance.getComponent(this.cell.state.target).then(function(component) {
				self.component = component;
			});
		}
	},
	methods: {
		load: function(page) {
			if (this.component) {
				var self = this;
				return this.component.runAction("jump-page", {
					page: page
				}).then(function(paging) {
					nabu.utils.objects.merge(self.paging, paging);
				});
			}
		},
		configurator: function() {
			return "page-paging-configure";
		}
	},
	watch: {
		component: function(component) {
			if (component) {
				var self = this;
				component.runAction("get-paging").then(function(paging) {
					console.log("received", paging);
					nabu.utils.objects.merge(self.paging, paging);
				});
			}
		}
	}
});

Vue.component("page-paging-configure", {
	template: "#page-paging-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		},
		childComponents: {
			type: Object,
			required: false
		}
	}
})
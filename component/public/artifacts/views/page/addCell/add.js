if (!nabu) { var nabu = {} }
if (!nabu.views) { nabu.views = {} }
if (!nabu.views.cms) { nabu.views.cms = {} }

nabu.views.cms.PageAddCell = Vue.extend({
	template: "#cms-page-add-cell",
	props: {
		page: {
			type: Object,
			required: true
		}
	},
	data: function() {
		return {
			route: null,
			bindings: {}
		}
	},
	computed: {
		parameters: function() {
			return this.route ? this.$services.page.getRouteParameters(this.route) : [];
		},
		availableParameters: function() {
			// there are all the events
			var available = nabu.utils.objects.clone(this.$services.page.instances[this.page.name].getEvents());
			// and the page
			available.page = this.$services.page.getPageParameters(this.page);
			return available;
		}
	},
	methods: {
		filterRoutes: function(value) {
			var routes = this.$services.router.list().filter(function(x) {
				return x.alias && (!value || x.alias.toLowerCase().indexOf(value.toLowerCase()) >= 0);
			});
			routes.sort(function(a, b) {
				return a.alias.localeCompare(b.alias);
			});
			return routes;
		},
		set: function() {
			this.$resolve({
				alias: this.route.alias,
				bindings: this.bindings
			})
		}
	}
})
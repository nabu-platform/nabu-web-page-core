Vue.component("page-components-overview", {
	template: "#page-components-overview",
	computed: {
		components: function() {
			// only keep the routes with a visual icon and a name
			return this.$services.router.router.routes.filter(function(x) {
				return x.icon && x.name;
			});
		},
		categories: function() {
			var groups = [];
			this.components.forEach(function(x) {
				if (x.category && groups.indexOf(x.category) < 0) {
					groups.push(x.category);
				}
				else if (x.category == null && groups.indexOf("Miscellaneous") < 0) {
					groups.push("Miscellaneous");
				}
			});
			groups.sort();
			return groups;
		}
	},
	methods: {
		getCategory: function(category) {
			return this.components.filter(function(x) {
				return x.category == category || (category == "Miscellaneous" && x.category == null);
			});
		},
		dragComponent: function(event, component) {
			event.dataTransfer.setData("component-alias", component.alias);
		},
		prettyPrint: function(name) {
			name = name.replace(/([A-Z]+)/, " $1");
			return name.substring(0, 1).toUpperCase() + name.substring(1);
		}
	}
});
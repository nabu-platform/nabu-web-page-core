Vue.component("page-components-overview", {
	template: "#page-components-overview",
	computed: {
		// should all structures have a row at the root?
		structures: function() {
			return nabu.page.providers("page-structure");
		},
		components: function() {
			// only keep the routes with a visual icon and a name
			return this.$services.router.router.routes.filter(function(x) {
				return x.icon && x.name;
			});
		},
		componentCategories: function() {
			var groups = [];
			this.components.forEach(function(x) {
				if (x.category && groups.indexOf(x.category) < 0) {
					groups.push(x.category);
				}
				else if (x.category == null && groups.indexOf("Miscellaneous") < 0) {
					groups.push("Miscellaneous");
				}
			});
			groups.sort(function(a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			});
			return groups;
		},
		structureCategories: function() {
			var groups = [];
			this.structures.forEach(function(x) {
				if (x.category && groups.indexOf(x.category) < 0) {
					groups.push(x.category);
				}
				else if (x.category == null && groups.indexOf("Miscellaneous") < 0) {
					groups.push("Miscellaneous");
				}
			});
			groups.sort(function(a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			});
			return groups;
		}
	},
	data: function() {
		return {
			selected: 'components'
		}
	},
	methods: {
		getStructureCategory: function(category) {
			return this.structures.filter(function(x) {
				return x.category == category || (category == "Miscellaneous" && x.category == null);
			});
		},
		getComponentCategory: function(category) {
			return this.components.filter(function(x) {
				return x.category == category || (category == "Miscellaneous" && x.category == null);
			});
		},
		dragComponent: function(event, component) {
			event.dataTransfer.setData("component-alias", component.alias);
			if (component.form) {
				event.dataTransfer.setData("form-name", component.form);
			}
		},
		dragStructure: function(event, structure) {
			event.dataTransfer.setData("structure-content", JSON.stringify(structure.content));
		},
		prettyPrint: function(name) {
			name = name.replace(/([A-Z]+)/, " $1");
			return name.substring(0, 1).toUpperCase() + name.substring(1);
		}
	}
});
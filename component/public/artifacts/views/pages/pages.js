if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

nabu.page.views.Pages = Vue.extend({
	template: "#pages",
	data: function() {
		return {
			parameters: {},
			showing: false,
			pageToRoute: null,
			// the currently open category
			opened: null,
			lastColor: {}
		}
	},
	computed: {
		categories: function() {
			var categories = [];
			var hasEmpty = false;
			this.$services.page.pages.map(function(x) {
				if (!x.content.category) {
					hasEmpty = true;
				}
				else if (categories.indexOf(x.content.category ? x.content.category : null) < 0) {
					categories.push(x.content.category ? x.content.category : null);
				}
			});
			categories.sort();
			if (hasEmpty) {
				categories.unshift(null);
			}
			return categories;
		}
	},
	ready: function() {
		var self = this;
		this.$el.addEventListener("paste", function(event) {
			var data = event.clipboardData.getData("text/plain");
			if (data) {
				var parsed = JSON.parse(data);
				if (parsed && parsed.type == "page-category") {
					self.$confirm({ 
						message: "Are you sure you want to add the category '" + parsed.category + "' to this website?", 
						type: 'question', 
						ok: 'Add'
					}).then(function() {
						parsed.pages.map(function(page) {
							self.$services.page.update(page);
						})
					});
				}
			}
		});
	},
	methods: {
		getRoutes: function(newValue) {
			var routes = this.$services.router.list().filter(function(x) { return !!x.alias }).map(function(x) { return x.alias });
			if (newValue) {
				routes = routes.filter(function(x) { return x.toLowerCase().indexOf(newValue.toLowerCase()) >= 0 });
			}
			routes.sort();
			return routes;
		},
		copyCategory: function(category) {
			nabu.utils.objects.copy({
				type: "page-category",
				category: category,
				pages: this.getPagesFor(category)
			});
		},
		getPagesFor: function(category) {
			return this.$services.page.pages.filter(function(x) {
				return (!category && !x.content.category) || x.content.category == category;
			});
		},
		insertColor: function(style, color) {
			this.$refs['editors_' + style.name][0].insert(color);
		},
		remove: function(page) {
			var self = this;
			this.$confirm({
				message: "Are you sure you want to delete page '" + page.name + "'?"
			}).then(function() {
				self.$services.page.remove(page);
			});
		},
		create: function() {
			this.$services.page.create("new");
		},
		save: function(page) {
			this.$services.page.update(page);
			this.$services.page.loadPages([page]);
		},
		route: function(page) {
			this.pageToRoute = page;
			var parameters = this.$services.page.getPageParameters(page);
			if (Object.keys(parameters.properties).length) {
				var result = {};
				Object.keys(parameters.properties).map(function(key) {
					result[key] = null;
				})
				Vue.set(this, "parameters", result);
				this.showing = true;
			}
			else {
				this.doRoute();
			}
		},
		doRoute: function() {
			this.$services.router.route(this.$services.page.alias(this.pageToRoute), this.parameters);
		}
	}
});
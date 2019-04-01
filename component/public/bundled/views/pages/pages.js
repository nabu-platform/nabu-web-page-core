if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

nabu.page.views.Pages = Vue.extend({
	template: "#nabu-pages",
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
		document.body.removeAttribute("page");
		document.body.removeAttribute("category");
		// this can make it harder to style the index itself, but otherwise the pages page keeps refreshing while you are styling
		// which can be awefully annoying as it is autosave
		this.$services.page.disableReload = true;
		if (this.$services.page.canEdit()) {
			var self = this;
			this.$el.addEventListener("paste", function(event) {
				var data = event.clipboardData.getData("text/plain");
				if (data) {
					var parsed = JSON.parse(data);
					console.log("parsed is", parsed);
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
					// check for some markers that it is a page
					else if (parsed && parsed.category && parsed.name && parsed.rows && parsed.counter != null) {
						self.$prompt(function() {
							return new nabu.page.views.PagesPaste({data: {
								category: parsed.category,
								name: parsed.name
							}});
						}).then(function(result) {
							parsed.name = result.name;
							parsed.category = result.category;
							var page = {
								content: parsed,
								name: parsed.name
							}
							self.$services.page.update(page);
						});
						/*
						self.$confirm({ 
							message: "Are you sure you want to add the page '" + parsed.path + "' from category '" + parsed.category + "' to this website?", 
							type: 'question', 
							ok: 'Add'
						}).then(function() {
							var page = {
								content: parsed,
								name: parsed.name ? parsed.name : prompt("Name of the page?")
							}
							if (page.name) {
								self.$services.page.update(page);
							}
						});
						*/
					}
				}
			});
		}
		else {
			this.$services.router.route("login");
		}
	},
	beforeDestroy: function() {
		this.$services.page.disableReload = false;	
	},
	methods: {
		addTransformerParameter: function(transformer, type) {
			transformer[type].push({});
		},
		updatePageName: function(page, newValue) {
			console.log("page name is", page.name, newValue);
			var result = this.$refs["category_" + page.content.category][0].validate(true);
			if (result.length == 0) {
				// check that the name is not in use
				this.$services.page.rename(page, newValue);
			}
		},
		customNameValidator: function(newValue) {
			var messages = [];
			if (this.$services.page.pages.filter(function(x) { return x.content.name == newValue }).length > 0) {
				messages.push({
					severity: "error",
					title: "Name already in use",
					soft: false
				});
			}
			console.log("validating custom", newValue, messages);
			return messages;
		},
		copy: function(page) {
			console.log("page is", page);
			nabu.utils.objects.copy(page.content);
		},
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

nabu.page.views.PagesPaste = Vue.extend({
	template: "#nabu-pages-paste",
	data: function() {
		return {
			category: null,
			name: null
		}
	}
});
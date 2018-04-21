nabu.services.VueService(Vue.extend({
	//services: ["user", "swagger"],
	services: ["swagger"],
	data: function() {
		return {
			pages: [],
			loading: true,
			// contains a reference to the page instances
			instances: {}
		}
	},
	activate: function(done) {
		var self = this;
		this.$services.swagger.execute("nabu.cms.page.rest.page.list").then(function(list) {
			if (list.pages) {
				nabu.utils.arrays.merge(self.pages, list.pages);
				self.loadPages(self.pages);
			}
			Vue.nextTick(function() {
				self.loading = false;
			});
			done();
		});
	},
	methods: {
		pathParameters: function(url) {
			if (!url) {
				url = this.page.path;
			}
			var variables = url.match(/\{[\s]*[^}:]+[\s]*(:[\s]*([^}]+)[\s]*|)\}/g);
			return !variables ? [] : variables.map(function(variable) {
				return variable.substring(1, variable.length - 1).replace(/:.*$/, "");
			});
		},
		alias: function(page) {
			return "cms-page-" + page.name;
		},
		create: function(name) {
			return this.$services.swagger.execute("nabu.cms.page.rest.page.create", {
				body: {
					name: name,
					path: "/page/" + name
				}
			}).then(function(page) {
				self.pages.push(page);
			})
		},
		update: function(page) {
			page.marshalled = JSON.stringify(page.content);
			return this.$services.swagger.execute("nabu.cms.page.rest.page.update", { pageId: page.id, body: page });
		},
		loadPages: function(pages) {
			var self = this;
			pages.map(function(page) {
				if (!page.content) {
					Vue.set(page, "content", self.normalize(page.marshalled ? JSON.parse(page.marshalled) : {}));
				}
				
				var existingRoute = self.$services.router.get(self.alias(page));
				
				var route = {
					alias: self.alias(page),
					url: page.path,
					query: page.content.query ? page.query : [],
					enter: function(parameters) {
						return new nabu.views.cms.Page({propsData: {page: page, parameters: parameters }});
					}
				};
				
				self.$services.router.register(route);
				if (existingRoute) {
					self.$services.router.unregister(existingRoute);
				}
			});
		},
		normalize: function(content) {
			// the rows with content
			if (!content.rows) {
				content.rows = [];
			}
			// a counter that serves as id generator
			if (!content.counter) {
				content.counter = 0;
			}
			// contains the definition of the variables (usually just a name)
			// does _not_ contain the value, this is a runtime thing
			if (!content.variables) {
				content.variables = [];
			}
			// definition of the query parameters
			if (!content.query) {
				content.query = [];
			}
			// contains the events, each event has:
			// - name
			// - parameters (a list of fields, you can also choose to get "all" the fields)
			// - number of emitters: everytime we register the event, we increment, if we unregister we decrement
			// - subscriptions: array of cell ids that are listening to this event
			if (!content.events) {
				content.events = [];
			}
			return content;
		},
		getRouteParameters: function(route) {
			var parameters = [];
			if (route.url) {
				nabu.utils.arrays.merge(parameters, this.pathParameters(route.url));
			}
			if (route.query) {
				nabu.utils.arrays.merge(parameters, route.query);
			}
			if (route.parameters) {
				nabu.utils.arrays.merge(parameters, route.parameters);
			}
			parameters.sort();
			return parameters;
		},
		getPageParameters: function(page) {
			var parameters = [];
			nabu.utils.arrays.merge(parameters, this.pathParameters(page.path));
			if (page.content.query) {
				nabu.utils.arrays.merge(parameters, page.content.query);
			}
			parameters.sort();
			return parameters;
		}
	},
	watch: {
		pages: function(newValue) {
			if (!this.loading) {
				this.loadPages(newValue);
			}
		}
	}
}), { name: "nabu.services.cms.Page" });
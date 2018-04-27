nabu.services.VueService(Vue.extend({
	services: ["user", "swagger"],
	data: function() {
		return {
			applicationId: null,
			title: null,
			pages: [],
			loading: true,
			// contains a reference to the page instances
			instances: {},
			// application properties
			properties: [],
			// application styles
			styles: [],
			lastCompiled: null,
			customStyle: null,
			cssStep: null
		}
	},
	activate: function(done) {
		var self = this;
		
		var promise = this.$services.q.defer();
		
		// inject some javascript stuff if we are in edit mode
		if (this.canEdit()) {
			// assumed present by some libraries...
			//this.inject("https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.5/require.js", function() {
				// inject ace editor
				// check out https://cdnjs.com/libraries/ace/
				self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ace.js", function() {
					self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-scss.js");
					self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-javascript.js");
					self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ext-language_tools.js");
					self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ext-whitespace.js");
					
					// inject sass compiler
					self.inject("https://cdnjs.cloudflare.com/ajax/libs/sass.js/0.10.9/sass.js", function() {
						self.inject("https://cdnjs.cloudflare.com/ajax/libs/sass.js/0.10.9/sass.worker.js", function() {
							promise.resolve();
						});
					});
				});
			//});
		}
		else {
			promise.resolve();
		}
		
		promise.then(function() {
			self.$services.swagger.execute("nabu.cms.page.rest.configuration").then(function(configuration) {
				if (configuration.pages) {
					nabu.utils.arrays.merge(self.pages, configuration.pages);
					self.loadPages(self.pages);
				}
				if (configuration.applicationId) {
					self.applicationId = configuration.applicationId;
				}
				if (configuration.properties) {
					nabu.utils.arrays.merge(self.properties, configuration.properties);
				}
				if (configuration.title) {
					self.title = configuration.title;
				}
				if (self.canEdit()) {
					self.$services.swagger.execute("nabu.cms.page.rest.style.list", { applicationId: configuration.applicationId }).then(function(list) {
						if (list.pages) {
							list.pages.sort(function(a, b) {
								return a.priority - b.priority;
							});
							nabu.utils.arrays.merge(self.styles, list.pages);
						}
						Vue.nextTick(function() {
							self.loading = false;
						});
						done();
						if (self.canEdit()) {
							self.compileCss();
						}
					});
				}
				else {
					Vue.nextTick(function() {
						self.loading = false;
					});
					done();
					// start a compilation sequence, you may have new stuff pending that is not yet saved
					if (self.canEdit()) {
						self.compileCss();
					}
				}
			});
		})
	},
	methods: {
		saveCompiledCss: function() {
			this.$services.swagger.execute("nabu.cms.page.rest.style.compile", {
				applicationId: this.applicationId,
				body: {
					compiled: this.lastCompiled
				}
			});
		},
		createStyle: function() {
			var self = this;
			this.$services.swagger.execute("nabu.cms.page.rest.style.create", {applicationId: this.applicationId, body: {
				name: "unnamed",
				title: "page",
				description: ""
			}}).then(function(created) {
				self.styles.push(created);
			});
		},
		updateCss: function(style, rebuild) {
			var self = this;
			this.$services.swagger.execute("nabu.cms.page.rest.style.update", {
				styleId: style.id,
				body: style
			}).then(function() {
				if (rebuild) {
					self.compileCss();
				}	
			});
		},
		compileCss: function() {
			this.cssStep = "refresh";
			var self = this;
			Sass.importer(function(request, done) {
				var commonFiles = "";
				self.styles.filter(function(x) {
					return x.title == "utility" && x.description;
				}).map(function(x) {
					commonFiles += "@import '" + x.name + "';\n";
				});
				// Sass.js already found a file, we probably want to just load that
				if (request.path) {
					done();
				}
				// provide a file
				else if (request.current) {
					var style = self.styles.filter(function(x) {
						return x.name == request.current;
					})[0];
					var content = style ? style.description : null;
					if (style.title != "utility") {
						content = commonFiles + content;
					}
					if (content) {
						self.cssStep = "check-square-o";
						done({
							content: content
						});
					}
					else {
						self.cssStep = "exclamation-triangle";
						done({
							error: "Could not find: " + request.current
						});
					}
				}
				// provide a specific content
				else if (request.current === 'redirect') {
					throw "redirect not supported currently";
					done({
						path: '/sass/to/some/other.scss'
					});
				}
				else if (request.current === 'error') {
					// provide content directly
					// note that there is no cache
					done({
						error: 'import failed because...no one knows'
					});
				}
				else {
					// let libsass handle the import
					done();
				}
			});
			var scss = "";
			this.styles.filter(function(x) { return x.title != "utility" && x.description }).map(function(x) {
				scss += "@import '" + x.name + "';\n";
			});
			console.log("compiling", scss);
			Sass.compile(scss, function(result) {
				if (result.status == 0) {
					if (self.customStyle) {
						document.head.removeChild(self.customStyle);
					}
					self.customStyle = document.createElement("style");
					self.customStyle.innerHTML = result.text;
					self.customStyle.innerHTML += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(JSON.stringify(result.map)) + " */";
					document.head.appendChild(self.customStyle);
					self.lastCompiled = result.text;
				}
				else {
					console.log("Compilation failed", result);
				}
			});
		},
		inject: function(link, callback) {
			var script = document.createElement("script");
			script.setAttribute("src", link);
			script.setAttribute("type", "text/javascript");
			
			if (callback) {
				// IE
				if (script.readyState){  
					script.onreadystatechange = function() {
						if (script.readyState == "loaded" || script.readyState == "complete") {
							script.onreadystatechange = null;
							callback();
						}
					};
				}
				// rest
				else { 
					script.onload = function() {
						callback();
					};
				}
			}
			document.head.appendChild(script);
		},
		canEdit: function() {
			return this.$services.user.hasAction("page.admin");	
		},
		pathParameters: function(url) {
			if (!url) {
				return [];
			}
			var variables = url.match(/\{[\s]*[^}:]+[\s]*(:[\s]*([^}]+)[\s]*|)\}/g);
			return !variables ? [] : variables.map(function(variable) {
				return variable.substring(1, variable.length - 1).replace(/:.*$/, "");
			});
		},
		alias: function(page) {
			return "cms-page-" + page.name;
		},
		remove: function(page) {
			var self = this;
			this.$services.swagger.execute("nabu.cms.page.rest.page.delete", {pageId: page.id}).then(function() {
				self.pages.splice(self.pages.indexOf(page), 1);
			});
		},
		create: function(name) {
			var self = this;
			return this.$services.swagger.execute("nabu.cms.page.rest.page.create", {
				applicationId: this.applicationId,
				body: {
					name: name,
					path: "/page/" + name
				}
			}).then(function(page) {
				self.pages.push(page);
			})
		},
		update: function(page) {
			page.description = JSON.stringify(page.content);
			return this.$services.swagger.execute("nabu.cms.page.rest.page.update", { pageId: page.id, body: page });
		},
		loadPages: function(pages) {
			var self = this;
			pages.map(function(page) {
				if (!page.content) {
					Vue.set(page, "content", self.normalize(page.description ? JSON.parse(page.description) : {}));
				}
				
				var existingRoute = self.$services.router.get(self.alias(page));
				
				var route = {
					alias: self.alias(page),
					url: page.content.initial ? "/.*" : page.content.path,
					query: page.content.query ? page.content.query : [],
					enter: function(parameters) {
						if (page.content.initial) {
							var found = false;
							// check that there is a row with the default anchor, if not, insert it
							for (var i = 0; i < page.content.rows.length; i++) {
								if (page.content.rows[i].customId == "main") {
									found = true;
									break;
								}
							}
							if (!found) {
								page.content.rows.push({
									id: 0,
									customId: "main",
									cells: [],
									class: null
								});
							}
						}
						return new nabu.views.cms.Page({propsData: {page: page, parameters: parameters }});
					},
					initial: page.content.initial,
					slow: !page.content.initial && page.content.slow
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
			if (!content.path) {
				content.path = null;
			}
			// a counter that serves as id generator
			if (!content.counter) {
				content.counter = 1;
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
			// actions linked to an event
			if (!content.actions) {
				content.actions = [];
			}
			// css class
			if (!content.class) {
				content.class = null;
			}
			if (!content.initial) {
				content.initial = false;
			}
			if (!content.menuX) {
				content.menuX = 0;
			}
			if (!content.menuY) {
				content.menuY = 0;
			}
			if (!content.states) {
				content.states = [];
			}
			if (!content.category) {
				content.category = null;
			}
			if (!content.slow) {
				content.slow = false;
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
		getStateParameters: function(page) {
			
		},
		getPageParameters: function(page) {
			var parameters = [];
			nabu.utils.arrays.merge(parameters, this.pathParameters(page.content.path));
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
		},
		title: function(newValue) {
			document.title = newValue;
		}
	}
}), { name: "nabu.services.cms.Page" });
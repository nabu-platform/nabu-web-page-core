if (!nabu) { var nabu = {} };
if (!nabu.page) { nabu.page = {}}

nabu.page.provide = function(spec, implementation) {
	if (!nabu.page.state) {
		nabu.page.state = { providers: [] }
	}
	if (!nabu.page.state.providers[spec]) {
		nabu.page.state.providers[spec] = [];
	}
	nabu.page.state.providers[spec].push(implementation);
}

nabu.page.providers = function(spec) {
	return nabu.page.state && nabu.page.state.providers[spec] ? nabu.page.state.providers[spec] : [];
}

nabu.services.VueService(Vue.extend({
	services: ["swagger"],
	data: function() {
		return {
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
			cssStep: null,
			editable: false
		}
	},
	activate: function(done) {
		var self = this;
		
		var injectJavascript = function() {
			var promise = self.$services.q.defer();
		
			// inject some javascript stuff if we are in edit mode
			//self.inject("https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.js");
			// inject ace editor
			// check out https://cdnjs.com/libraries/ace/
			self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ace.js", function() {
				self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-scss.js");
				self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-javascript.js");
				self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-html.js");
				self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ext-language_tools.js");
				self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ext-whitespace.js");
				
				// inject sass compiler
				self.inject("https://cdnjs.cloudflare.com/ajax/libs/sass.js/0.10.9/sass.js", function() {
					self.inject("https://cdnjs.cloudflare.com/ajax/libs/sass.js/0.10.9/sass.worker.js", function() {
						promise.resolve();
					});
				});
			});
			return promise;
		}

		self.$services.swagger.execute("nabu.web.page.core.rest.configuration.get").then(function(configuration) {
			self.editable = configuration.editable;
			if (configuration.pages) {
				nabu.utils.arrays.merge(self.pages, configuration.pages);
				self.loadPages(self.pages);
			}
			if (configuration.properties) {
				nabu.utils.arrays.merge(self.properties, configuration.properties);
			}
			if (configuration.title) {
				self.title = configuration.title;
			}
			if (self.canEdit()) {
				injectJavascript().then(function() {
					Vue.nextTick(function() {
						self.loading = false;
					});
					done();
				});
			}
			else {
				Vue.nextTick(function() {
					self.loading = false;
				});
				done();
			}
		});
	},
	methods: {
		getOperations: function(accept) {
			var result = [];
			var operations = this.$services.swagger.operations;
			Object.keys(operations).map(function(operationId) {
				if (accept(operations[operationId])) {
					result.push(operations[operationId]);
				}
			});
			result.sort(function(a, b) {
				return a.id.localeCompare(b.id);
			});
			return result;
		},
		getSimpleClasses: function(value) {
			var classes = ["primary", "secondary", "info", "success", "warning", "danger"];
			if (value) {
				classes = classes.filter(function(x) {
					return x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				});
			}
			// the class itself is allowed
			if (classes.indexOf(value) < 0) {
				classes.push(value);
			}
			return classes;
		},
		getDynamicClasses: function(styles, state) {
			if (!styles) {
				return [];
			}
			var self = this;
			return styles.filter(function(style) {
				return self.isCondition(style.condition, state);
			}).map(function(style) {
				return style.class;
			});
		},
		isCondition: function(condition, state) {
			if (!condition) {
				return true;
			}
			var result = eval(condition);
			if (result instanceof Function) {
				result = result(state);
			}
			return result == true;
		},
		classes: function(clazz) {
			var result = [];
			var sheets = document.styleSheets;
			for (var l = 0; l < sheets.length; l++) {
				var rules = sheets.item(l).rules || sheets.item(l).cssRules;
				for (var i = 0; i < rules.length; i++) {
					var rule = rules.item(i);
					if (rule.selectorText) {
						if (rule.selectorText.match(new RegExp(".*\\." + clazz + "\\.([\\w-]+)\\b.*", "g"))) {
							var match = rule.selectorText.replace(new RegExp(".*\\." + clazz + "\\.([\\w-]+)\\b.*", "g"), "$1");
							if (result.indexOf(match) < 0) {
								result.push(match);
							}
						}
					}
				}
			}
			// the class itself is allowed
			if (result.indexOf(clazz) < 0) {
				result.push(clazz);
			}
			return result;
		},
		getSimpleKeysFor: function(definition, includeComplex, keys, path) {
			var self = this;
			var sort = false;
			if (!keys) {
				keys = [];
				sort = true;
			}
			if (definition && definition.properties) {
				Object.keys(definition.properties).map(function(key) {
					// arrays can not be chosen, you need to bind them first
					if (definition.properties[key].type != "array") {
						var childPath = (path ? path + "." : "") + key;
						if (includeComplex || !definition.properties[key].properties) {
							keys.push(childPath);
						}
						// if it is complex, recurse
						if (definition.properties[key].properties) {
							self.getSimpleKeysFor(definition.properties[key], includeComplex, keys, childPath);
						}
					}
				});
			}
			if (sort) {
				keys.sort();
			}
			return keys;
		},
		saveConfiguration: function() {
			var self = this;
			return this.$services.swagger.execute("nabu.web.page.core.rest.configuration.update", {
				body: {
					title: this.title,
					properties: self.properties
				}
			});
		},
		saveCompiledCss: function() {
			this.$services.swagger.execute("nabu.web.page.core.rest.style.compile", {
				applicationId: this.applicationId,
				body: {
					compiled: this.lastCompiled
				}
			});
		},
		createStyle: function() {
			var self = this;
			this.$services.swagger.execute("nabu.web.page.core.rest.style.create", { applicationId: this.applicationId, body: {
				name: "unnamed",
				title: "page",
				description: ""
			}}).then(function(created) {
				self.styles.push(created);
			});
		},
		updateCss: function(style, rebuild) {
			var self = this;
			this.$services.swagger.execute("nabu.web.page.core.rest.style.update", {
				applicationId: configuration.applicationId,
				body: style
			}).then(function() {
				if (rebuild && false) {
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
			return this.editable;	
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
			return page.name;
		},
		rename: function(page, name) {
			var oldName = page.name;
			page.name = name;
			var self = this;
			this.update(page).then(function() {
				self.removeByName(oldName);
			})	
		},
		remove: function(page) {
			var self = this;
			this.removeByName(page.name).then(function() {
				self.pages.splice(self.pages.indexOf(page), 1);
			});
		},
		removeByName: function(name) {
			return this.$services.swagger.execute("nabu.web.page.core.rest.page.delete", {name: name});
		},
		create: function(name) {
			return this.update({
				name: name
			});
		},
		update: function(page) {
			var self = this;
			if (!page.content) {
				page.content = {};
			}
			page.marshalled = JSON.stringify(page.content);
			return this.$services.swagger.execute("nabu.web.page.core.rest.page.update", { body: page }).then(function() {
				// add it to the pages if it isn't there yet (e.g. create)
				if (self.pages.indexOf(page) < 0) {
					self.normalize(page.content);
					self.pages.push(page);
				}
			});
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
						return new nabu.page.views.Page({propsData: {page: page, parameters: parameters }});
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
			var result = {
				properties: {}
			};
			if (route.url) {
				this.pathParameters(route.url).map(function(key) {
					result.properties[key] = {
						type: "string"
					}
				});
			}
			if (route.query) {
				route.query.map(function(key) {
					// the key could already be a complex definition (though unlikely)
					result.properties[key] = typeof(key) == "string" ? {type: "string"} : key;
				});
			}
			// we assume a parameters object that has the json-esque definitions
			if (route.parameters) {
				nabu.utils.objects.merge(result.properties, route.parameters);
			}
			return result;
		},
		getArrays: function(definition, path, arrays) {
			if (!arrays) {
				arrays = [];
			}
			if (definition.properties) {
				var keys = Object.keys(definition.properties);
				for (var i = 0; i < keys.length; i++) {
					var property = definition.properties[keys[i]];
					var childPath = (path ? path + "." : "") + keys[i];
					if (property.type == "array") {
						arrays.push(childPath);
					}
					else if (property.properties) {
						this.getArrays(property, childPath, arrays);
					}
				}
			}
			return arrays;
		},
		getAvailableParameters: function(page, cell) {
			var result = {};
			// if we have an event-driven cell, we can access the events in the page
			if (cell && cell.on) {
				var pageInstance = this.instances[page.name];
				// the available events
				var available = pageInstance.getEvents();
				result[cell.on] = available[cell.on];
			}
			var self = this;
			// the available state
			page.content.states.map(function(state) {
				if (self.$services.swagger.operation(state.operation).responses && self.$services.swagger.operation(state.operation).responses["200"]) {
					result[state.name] = self.$services.swagger.resolve(self.$services.swagger.operation(state.operation).responses["200"]).schema;
				}
			});
			// and the page itself
			result.page = this.getPageParameters(page);
			return result;	
		},
		getAllArrays: function(page, targetId) {
			var self = this;
			var arrays = [];
			// get all the arrays available in the page itself
			// TODO: filter events that you are not registered on?
			var parameters = this.getAvailableParameters(page);
			Object.keys(parameters).map(function(key) {
				nabu.utils.arrays.merge(arrays, self.getArrays(parameters[key]).map(function(x) { return key + "." + x }));
			});
			// get all arrays available in parent rows/cells
			var path = this.getTargetPath(targetId);
			if (path.length) {
				path.map(function(entry) {
					if (entry.instances) {
						Object.keys(entry.instances).map(function(key) {
							var mapping = entry.instances[key];
							var index = mapping.indexOf(".");
							var variable = mapping.substring(0, index);
							var path = mapping.substring(index + 1);
							var definition = self.getChildDefinition(parameters[variable], path);
							nabu.utils.arrays.merge(arrays, self.getArrays(definition).map(function(x) { return variable + "." + x }));
						});
					}
				});
			}
			return arrays;
		},
		getChildDefinition: function(definition, path, parts, index) {
			if (!parts) {
				parts = path.split(".");
				index = 0;
			}
			var properties = definition.type == "array" ? definition.items.properties : definition.properties;
			if (properties) {
				var child = properties[parts[index]];
				if (index == parts.length - 1) {
					return child;
				}
				else {
					return this.getDefinition(child, path, parts, index + 1);
				}
			}
			return null;
		},
		getPageParameters: function(page) {
			var parameters = {
				properties: {}
			};
			if (page.content.path) {
				this.pathParameters(page.content.path).map(function(x) {
					parameters.properties[x] = {
						type: "string"
					}
				})
			}
			if (page.content.query) {
				page.content.query.map(function(x) {
					parameters.properties[x] = {
						type: "string"
					}
				});
			}
			// you can set parameters much like swagger input parameters
			// that means you can set a name
			// you can also set a default value and other stuff
			if (page.content.parameters) {
				page.content.parameters.map(function(x) {
					parameters.properties[x.name] = {
						type: "string"
					}
				});
			}
			// and you can set parameters at the web application level that are accessible to any page
			this.properties.map(function(property) {
				parameters.properties[property.key] = {
					type: "string"
				}
			});
			return parameters;
		},
		// retrieves the path of rows/cells to get to the targetId, this can be used to resolve instances for example
		getTargetPath: function(rowContainer, targetId, path) {
			var reverse = false;
			if (!path) {
				path = [];
				// we manage the complete path at this level, reverse when everything is done as the path contains everything in the reverse order
				reverse = true;
			}
			if (rowContainer.rows) {
				for (var i = 0; i < rowContainer.rows.length; i++) {
					var row = rowContainer.rows[i];
					if (row.id == targetId) {
						path.push(row);
					}
					else {
						for (var j = 0; j < row.cells.length; j++) {
							var cell = row.cells[j];
							if (cell.id == targetId) {
								path.push(cell);
								path.push(row);
							}
							else if (cell.rows) {
								getTargetPath(cell, targetId, path);
							}
							if (path.length) {
								path.push(cell);
								path.push(row);
								break;
							}
						}
					}
					if (path.length) {
						break;
					}
				}
			}
			if (reverse) {
				path.reverse();
			}
			return path;
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
}), { name: "nabu.services.Page" });
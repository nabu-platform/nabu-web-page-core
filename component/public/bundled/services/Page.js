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

nabu.page.instances = {};

nabu.services.VueService(Vue.extend({
	services: ["swagger", "user"],
	data: function() {
		return {
			counter: 1,
			title: null,
			home: null,
			homeUser: null,
			pages: [],
			loading: true,
			// application properties
			properties: [],
			// the devices for this application
			devices: [],
			// application styles
			styles: [],
			// functions
			functions: [],
			// custom content
			contents: [],
			// any imports
			imports: [],
			translations: [],
			lastCompiled: null,
			customStyle: null,
			cssStep: null,
			editable: false,
			wantEdit: false,
			copiedRow: null,
			copiedCell: null,
			useEval: false,
			cssLastModified: null,
			cssError: null,
			functionError: null,
			disableReload: false,
			validations: [],
			googleSiteVerification: null
		}
	},
	activate: function(done) {
		var self = this;
		// non-reactive
		this.pageCounter = 0;
		document.title = "%{Loading...}";
		window.addEventListener("paste", function(event) {
			var data = event.clipboardData.getData("text/plain");
			if (data) {
				try {
					var parsed = JSON.parse(data);
					if (parsed && parsed.type == "page-row") {
						self.copiedRow = parsed.content;
					}
					else if (parsed && parsed.type == "page-cell") {
						self.copiedCell = parsed.content;
					}
				}
				catch (exception) {
					// ignore
				}
			}
		});
		this.isServerRendering = navigator.userAgent.match(/Nabu-Renderer/);
		this.activate(done, true);
	},
	clear: function(done) {
		this.activate(done ? done : function() {}, false);
	},
	computed: {
		enumerators: function() {
			var providers = {};
			nabu.page.providers("page-enumerate").map(function(x) {
				providers[x.name] = x;
			});
			return providers;
		},
		isSsr: function() {
			return navigator.userAgent.match(/Nabu-Renderer/);
		}
	},
	created: function() {
		var self = this;
		document.addEventListener("keydown", function(event) {
			if (event.ctrlKey && event.altKey && event.keyCode == 88) {
				if (self.canEdit()) {
					self.wantEdit = !self.wantEdit;
				}
				else {
					self.$services.router.route("login");
				}
			}
		});
	},
	methods: {
		isClickable: function(element) {
			if (element.classList && element.classList.contains("clickable")) {
				return true;
			}
			else if (element.classList && element.classList.contains("unclickable")) {
				return false;
			}
			else if (element.parentNode) {
				return this.isClickable(element.parentNode);
			}
			else {
				return true;
			}
		},
		getAvailableTypes: function(value) {
			var types = ['string', 'boolean', 'number', 'integer'];
			nabu.utils.arrays.merge(types, Object.keys(this.$services.swagger.swagger.definitions));
			if (value) {
				types = types.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			return types;
		},
		getContent: function(page, key) {
			// if we are in development mode and no explicit language choice is made, don't show the contents, you want the json values
			if (${environment("development")} && (!this.$services.language || !this.$services.language.cookieValue)) {
				return null;
			}
			return this.contents.filter(function(x) {
				// if it is a different page we are not interested
				if (page && x.page != page) {
					return false;
				}
				// if we want a global content, don't take a page content
				else if (!page && x.page) {
					return false;
				}
				else {
					return x.key == key;
				}
			})[0];
		},
		formatFieldsLight: function(value, fields) {
			for (var i = 0; i < fields.length; i++) {
				
			}
		},
		activate: function(done, initial) {
			var self = this;
		
			var injectJavascript = function() {
				var promise = self.$services.q.defer();
			
				if (navigator.userAgent.indexOf("Trident") >= 0) {
					promise.resolve();
				}
				else {
					// inject some javascript stuff if we are in edit mode
					//self.inject("https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.js");
					// inject ace editor
					// check out https://cdnjs.com/libraries/ace/
					// if it fails, we ignore it and set editing to false
					self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ace.js", function() {
						self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-scss.js");
						self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-javascript.js");
						self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-html.js");
						self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ext-language_tools.js");
						self.inject("https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ext-whitespace.js");
						promise.resolve();
						// inject sass compiler
						/*self.inject("https://cdnjs.cloudflare.com/ajax/libs/sass.js/0.10.9/sass.js", function() {
							self.inject("https://cdnjs.cloudflare.com/ajax/libs/sass.js/0.10.9/sass.worker.js", function() {
								promise.resolve();
							});
						});*/
					}, function() {
						self.editable = false;
						promise.resolve();
					});
				}
				return promise;
			}
	
			self.$services.swagger.execute("nabu.web.page.core.rest.configuration.get").then(function(configuration) {
				self.editable = configuration.editable;
				self.pages.splice(0, self.pages.length);
				self.properties.splice(0, self.properties.length);
				self.devices.splice(0, self.devices.length);
				self.contents.splice(0);
				self.translations.splice(0);
				if (configuration.pages) {
					nabu.utils.arrays.merge(self.pages, configuration.pages);
					self.loadPages(self.pages);
				}
				if (configuration.properties) {
					nabu.utils.arrays.merge(self.properties, configuration.properties);
				}
				if (configuration.devices) {
					nabu.utils.arrays.merge(self.devices, configuration.devices);
				}
				if (configuration.title) {
					self.title = configuration.title;
				}
				if (configuration.home) {
					self.home = configuration.home;
				}
				if (configuration.homeUser) {
					self.homeUser = configuration.homeUser;
				}
				if (configuration.contents) {
					nabu.utils.arrays.merge(self.contents, configuration.contents);
				}
				if (configuration.translations) {
					nabu.utils.arrays.merge(self.translations, configuration.translations);
				}
				if (configuration.imports) {
					nabu.utils.arrays.merge(self.imports, configuration.imports);
				}
				if (configuration.googleSiteVerification) {
					self.googleSiteVerification = configuration.googleSiteVerification;
				}
				if (self.home || self.homeUser) {
					self.registerHome(self.home, self.homeUser);
				}
				if (self.googleSiteVerification) {
					var meta = document.createElement("meta");
					meta.setAttribute("name", "google-site-verification");
					meta.setAttribute("content", self.googleSiteVerification);
					document.head.appendChild(meta);
				}
				// don't do imports for server rendering, they should not be critical to the page and might not be parseable
				if (!navigator.userAgent.match(/Nabu-Renderer/)) {
					self.imports.forEach(function(x) {
						if (x.type == 'javascript') {
							self.inject(x.link, function() {}, x.async);
						}
					});
				}
				if (self.canEdit()) {
					var promises = [];
					promises.push(injectJavascript());
					promises.push(self.$services.swagger.execute("nabu.web.page.core.rest.style.list").then(function(list) {
						if (list && list.styles) {
							nabu.utils.arrays.merge(self.styles, list.styles);
						}
					}));
					promises.push(self.$services.swagger.execute("nabu.web.page.core.rest.function.list").then(function(list) {
						if (list && list.styles) {
							nabu.utils.arrays.merge(self.functions, list.styles.map(function(x) { return JSON.parse(x.content) }));
						}
					}));
					self.$services.q.all(promises).then(function() {
						console.log("resolved!");
						Vue.nextTick(function() {
							self.loading = false;
						});
						// start reloading the css at fixed intervals to pull in any relevant changes
						self.reloadCss();
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
		renumber: function(page, entity) {
			var self = this;
			if (entity.id) {
				entity.id = page.content.counter++;
			}
			if (entity.rows) {
				entity.rows.map(function(row) {
					self.renumber(page, row);
				});
			}
			if (entity.cells) {
				entity.cells.map(function(cell) {
					self.renumber(page, cell);
				});
			}
			return entity;
		},
		saveStyle: function(style) {
			var self = this;
			this.$services.swagger.execute("nabu.page.scss.compile", {body:{content:style.content}}).then(function() {
				self.cssError = null;
				return self.$services.swagger.execute("nabu.web.page.core.rest.style.write", {name:style.name, body: {
					content: style.content
				}});
			}, function(error) {
				var parsed = error.responseText ? JSON.parse(error.responseText) : error;
				if (parsed.description) {
					self.cssError = parsed.description.replace(/[\s\S]*CompilationException:([^\n]+)[\s\S]*/g, "$1");
				}
				else {
					console.error("scss error", error);
				}
			});
		},
		getGlobalEvents: function() {
			var events = {};
			this.pages.map(function(page) {
				if (page.content.globalEvents) {
					page.content.globalEvents.map(function(event) {
						var globalName = event.globalName ? event.globalName : event.localName;
						if (globalName != null) {
							if (events[globalName] == null) {
								var properties = event.properties;
								// if we have an instance of it, we can resolve the definition
								if (nabu.page.instances[page.content.name]) {
									properties = nabu.page.instances[page.content.name].getEvents()[event.localName];
								}
								events[globalName] = properties == null ? {properties:{}} : properties;
							}
						}
					});
				}
			});
			return events;
		},
		// push global events to all pages
		emit: function(event, data, source) {
			var instances = [];
			// make sure we don't emit it again to the source page
			if (source != null) {
				instances.push(source);
			}
			Object.keys(nabu.page.instances).map(function(key) {
				var instance = nabu.page.instances[key];
				if (instances.indexOf(instance) < 0) {
					if (instance.page.content.globalEventSubscriptions) {
						var globalEvent = instance.page.content.globalEventSubscriptions.filter(function(x) {
							return x.globalName == event;
						})[0];
						if (globalEvent) {
							instance.emit(globalEvent.localName != null ? globalEvent.localName : event, data);
						}
					}
					instances.push(instance);
				}
			});
		},
		getPageInstance: function(page, component) {
			var pageInstance = null;
			if (component && component.pageInstanceId != null) {
				pageInstance = nabu.page.instances[page.name + "." + component.pageInstanceId];
			}
			else if (component && component.$parent) {
				var parent = component.$parent;
				while (parent != null && parent.pageInstanceId == null) {
					parent = parent.$parent;
				}
				if (parent && parent.pageInstanceId != null) {
					pageInstance = nabu.page.instances[page.name + "." + parent.pageInstanceId];	
				}
			}
			if (!pageInstance && component && component.$root && component.$root.pageInstanceId != null) {
				pageInstance = nabu.page.instances[page.name + "." + component.$root.pageInstanceId];
			}
			return pageInstance ? pageInstance : nabu.page.instances[page.name];
		},
		setPageInstance: function(page, instance) {
			nabu.page.instances[page.name] = instance;
			if (instance.pageInstanceId != null) {
				nabu.page.instances[page.name + "." + instance.pageInstanceId] = instance;	
			}
		},
		destroyPageInstance: function(page, instance) {
			if (instance.pageInstanceId) {
				delete nabu.page.instances[page.name + "." + instance.pageInstanceId];
			}
			if (nabu.page.instances[page.name] == page) {
				delete nabu.page.instances[page.name];
			}
		},
		destroy: function(component) {
			if (component.page && component.cell) {
				var pageInstance = this.$services.page.getPageInstance(component.page, component);
				Vue.delete(pageInstance.components, component.cell.id, null);
			}	
		},
		reloadCss: function() {
			var self = this;
			nabu.utils.ajax({url:"${server.root()}page/v1/api/css-modified"}).then(function(response) {
				if (response.responseText != null && !self.disableReload) {
					var date = new Date(response.responseText);
					if (!self.cssLastModified) {
						self.cssLastModified = date;
					}
					else if (date.getTime() > self.cssLastModified.getTime()) {
						// actually reload
						var links = document.head.getElementsByTagName("link");
						for (var i = 0; i < links.length; i++) {
							var original = links[i].getAttribute("original");
							console.log("Reloading style", links[i].href);
							if (!original) {
								original = links[i].href;
								links[i].setAttribute("original", original);
							}
							links[i].setAttribute("href", original + "&loadTime=" + date.getTime());
						}
						self.cssLastModified = date;
					}
				}
				setTimeout(self.reloadCss, 2000);
			});
		},
		getFunctionDefinition: function(id) {
			return this.listFunctionDefinitions().filter(function(x) { return x.id == id })[0];
		},
		getRunnableFunction: function(id) {
			var parts = id.split(".");
			var target = window;
			for (var i = 0; i < parts.length - 1; i++) {
				if (!target[parts[i]]) {
					target = null;
					break;
				}
				target = target[parts[i]];
			}
			var func = target == null ? null : target[parts[parts.length - 1]];	
			// if we didn't find a custom function, check provided ones
			if (!func) {
				var result = nabu.page.providers("page-function").filter(function(x) {
					return x.id == id;
				})[0];
				if (result) {
					func = result.implementation;
				}
			}
			return func;
		},
		runFunction: function(func, input, context, promise) {
			var definition = null;
			if (typeof(func) == "string") {
				definition = this.getFunctionDefinition(func);
				var id = func;
				func = this.getRunnableFunction(id);
				if (!func) {
					throw "Could not find function: " + id;
				}
			}
			var resolve = function(result) {
				console.log("resolving", result);
				if (promise) {
					promise.resolve(result);
				}
			};
			var reject = function(result) {
				if (result.responseText) {
					result = JSON.parse(result.responseText);
				}
				console.log("rejecting", result);
				if (promise) {
					promise.reject(result);
				}
			};
			try {
				var returnValue = func(input, this.$services, context && context.$value ? context.$value : function() {}, definition && definition.async ? resolve : null, definition && definition.async ? reject : null);
				// if not async, call the done yourself
				if (definition && !definition.async) {
					resolve(returnValue);
				}
				return returnValue;
			}
			catch (exception) {
				reject(exception);
				throw exception;
			}
		},
		getBindingValue: function(pageInstance, bindingValue, context) {
			var self = this;
			// only useful if the binding value is a string
			if (typeof(bindingValue) == "string") {
				while (context && !context.localState) {
					context = context.$parent;
				}
				if (context) {
					var result = this.getValue(context.localState, bindingValue);
					if (result) {
						return result;
					}
				}
			}
			// if it has a label, we have a structure object
			else if (bindingValue && bindingValue.label) {
				if (bindingValue.label == "fixed") {
					return bindingValue.value;
				}
				else if (bindingValue.label == "$function") {
					/*
					var parts = bindingValue.value.split(".");
					var target = window;
					for (var i = 0; i < parts.length - 1; i++) {
						if (!target[parts[i]]) {
							throw "Could not find function: " + bindingValue.value;
						}
						target = target[parts[i]];
					}
					var func = target[parts[parts.length - 1]];
					*/
					
					var func = this.getRunnableFunction(bindingValue.value);
					if (!func) {
							throw "Could not find function: " + bindingValue.value;
					}
					if (bindingValue.lambda) {
						return function() {
							var def = self.getFunctionDefinition(bindingValue.value);
							var input = {};
							if (def.inputs) {
								var tmp = arguments;
								def.inputs.forEach(function(x, i) {
									input[x.name] = tmp[i];
								});
							}
							var output = self.runFunction(func, input, context);
							if (bindingValue.output) {
								output = output[bindingValue.output];
							}
							return output;
						}
					}
					var input = {};
					var self = this;
					if (bindingValue.bindings) {
						Object.keys(bindingValue.bindings).forEach(function(key) {
							if (bindingValue.bindings[key]) {
								var value = self.getBindingValue(pageInstance, bindingValue.bindings[key], context);
								self.setValue(input, key, value);
							}
						});
					}
					//var result = func(input, this.$services);
					var result = this.runFunction(func, input, context);
					if (bindingValue.output) {
						return this.getValue(result, bindingValue.output);
					}
					else {
						return result;
					}
				}
			}
			
			if (bindingValue == null) {
				return null;
			}
			var enumerators = this.enumerators;
			// allow for fixed values
			var value = bindingValue.indexOf("fixed") == 0 ? this.translate(bindingValue.substring("fixed.".length)) : pageInstance.get(bindingValue);
			var key = bindingValue.split(".")[0];
			// allow for enumerated values, if there is a provider with that name, check it
			if (!value && enumerators[key]) {
				var label = bindingValue.substring(key.length + 1);
				var enumeration = enumerators[key].enumerate().filter(function(x) {
					return enumerators[key].label ? x[enumerators[key].label] == label : x == label;
				})[0];
				if (enumeration != null && typeof(enumeration) != "undefined") {
					value = enumerators[key].value ? enumeration[enumerators[key].value] : enumeration;
				}
			}
			return value;
		},
		translateErrorCode: function(value, defaultValue) {
			var translations = !value ? [] : this.translations.filter(function(x) {
				// this is not actually a translation, fall back to defaults
				if (x.translation == x.name) {
					return false;
				}
				return value.toLowerCase() == x.name.toLowerCase()
					|| value.match(new RegExp(x.name.replace(/\*/g, ".*")));
			});
			var translation = null;
			if (translations.length > 1) {
				translations.forEach(function(x) {
					if (translation == null || translation.name.length < x.name.length)	 {
						translation = x;
					}
				});
			}
			else if (translations.length == 1) {
				translation = translations[0];
			}
			return translation && translation.translation 
				? translation.translation 
				: (defaultValue ? defaultValue : "%{An error has occurred while trying to complete your action}");
		},
		translate: function(value, component) {
			if (value && value.indexOf) {
				while (value.indexOf("%" + "{") >= 0) {
					var start = value.indexOf("%" + "{");
					var end = value.indexOf("}", start);
					// no end tag
					if (end < 0) {
						break;
					}
					var available = value.substring(start + 2, end);
					var parts = available.split(":");
					var translation = this.translations.filter(function(x) {
						return ((parts.length == 1 && x.context == null)
								|| (parts.length == 2 && x.context == parts[0]))
							&& (x.name == (parts.length == 1 ? parts[0] : parts[1]));
					})[0];
					value = value.substring(0, start) + (translation && translation.translation ? translation.translation : (parts.length == 1 ? parts[0] : parts[1])) + value.substring(end + 1);
				}
				return value;
			}
			/*if (value && value.indexOf && value.indexOf("%") == 0 && value.indexOf("{") == 1) {
				available = value.replace(/^%\{([^}]+)\}$/, "$1");
				var parts = available.split(":");
				translation = this.translations.filter(function(x) {
					return ((parts.length == 1 && x.context == null)
							|| (parts.length == 2 && x.context == parts[0]))
						&& (x.name == parts.length == 1 ? parts[0] : parts[1]);
				})[0];
			}*/
			return translation == null || translation.translation == null ? available : translation.translation;
		},
		interpret: function(value, component) {
			if (typeof(value) == "string" && value.length > 0 && value.substring(0, 1) == "=") {
				value = value.substring(1);
				var result = null;
				var stateOwner = component;
				while (!stateOwner.localState && stateOwner.$parent) {
					stateOwner = stateOwner.$parent;
				}
				if (stateOwner && stateOwner.localState) {
					result = this.eval(value, stateOwner.localState, component);
				}
				if (result == null && stateOwner && stateOwner.state) {
					result = this.eval(value, stateOwner.state, component);
				}
				if (result == null && component.page) {
					var pageInstance = this.getPageInstance(component.page, component);
					result = this.getBindingValue(pageInstance, value);
				}
				return result;
			}
			return value;
		},
		getValue: function(data, field) {
			if (field) {
				var parts = field.split(".");
				var value = data;
				parts.map(function(part) {
					// skip $all, you just want the entire value
					if (value && part != "$all") {
						value = value[part];
					}
				});
				return value;
			}
			return null;
		},
		setValue: function(data, field, value) {
			var tmp = data;
			var parts = field.split(".");
			for (var i = 0; i < parts.length - 1; i++) {
				if (parts[i] == "$all") {
					continue;
				}
				if (!tmp[parts[i]]) {
					Vue.set(tmp, parts[i], {});
				}
				tmp = tmp[parts[i]];
			}
			Vue.set(tmp, parts[parts.length - 1], value);
		},
		getInputBindings: function(operation) {
			var self = this;
			var bindings = {};
			if (operation && operation.parameters) {
				var self = this;
				operation.parameters.map(function(parameter) {
					if (parameter.in == "body") {
						var type = self.$services.swagger.resolve(parameter);
						if (type.schema.properties) {
							Object.keys(type.schema.properties).map(function(key) {
								// 1-level recursion (currently)
								// always add the element itself if it is a list (need to be able to add/remove it)
								if (type.schema.properties[key].type != "object") {
									var newKey = "body." + key;
									bindings[newKey] = null;
								}
								if (type.schema.properties[key].type == "object" || type.schema.properties[key].type == "array") {
									var properties = type.schema.properties[key].type == "array" ? type.schema.properties[key].items.properties : type.schema.properties[key].properties;
									Object.keys(properties).map(function(key2) {
										var newKey = "body." + key + "." + key2;
										bindings[newKey] = null;	
									});
								}
							});
						}
					}
					else {
						bindings[parameter.name] = null;
					}
				});
			}
			return bindings;
		},
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
			var classes = ["primary", "secondary", "info", "success", "warning", "danger", "inline"];
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
		getDynamicClasses: function(styles, state, instance) {
			if (!styles) {
				return [];
			}
			var self = this;
			return styles.filter(function(style) {
				return self.isCondition(style.condition, state, instance);
			}).map(function(style) {
				return self.$services.page.interpret(style.class, instance);
			});
		},
		getPageParameterValues: function(page, pageInstance) {
			// copy things like query parameters & path parameters
			var result = pageInstance.parameters ? nabu.utils.objects.clone(pageInstance.parameters) : {};
			// copy internal parameters as well
			if (page.content.parameters) {
				page.content.parameters.forEach(function(parameter) {
					result[parameter.name] = pageInstance.get("page." + parameter.name);
				});
			}
			return result;
		},
		isCondition: function(condition, state, instance) {
			if (!condition) {
				return true;
			}
			var result = this.eval(condition, state, instance);
			return result == true;
		},
		eval: function(condition, state, instance) {
			if (!condition) {
				return null;
			}
			if (this.useEval) {
				try {
					var result = eval(condition);
				}
				catch (exception) {
					console.warn("Could not evaluate", condition, exception);
					return false;
				}
				if (result instanceof Function) {
					result = result(state);
				}
				return result;
			}
			else {
				try {
					var resultFunction = Function('"use strict";return (function(state, $services, $value, application) { return ' + condition + ' })')();
					// by default it is bound to "undefined" apparently
					resultFunction = resultFunction.bind(this);
					var result = resultFunction(state, this.$services, instance ? instance.$value : function() { throw "No value function" }, application);
				}
				catch (exception) {
					if (${environment("development")}) {
						console.warn("Could not evaluate", condition, exception);
					}
					return null;
				}
				if (result instanceof Function) {
					result = result(state);
				}
				return result;
			}
			return null;
		},
		classes: function(clazz, value) {
			var result = [];
			var sheets = document.styleSheets;
			for (var l = 0; l < sheets.length; l++) {
				try {
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
				catch (exception) {
					// ignore
				}
			}
			if (value) {
				result = result.filter(function(x) {
					return x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				});
				// allow the (partial) value itself
				if (result.indexOf(value) < 0) {
					result.push(value);	
				}
			}
			return result;
		},
		getSimpleKeysFor: function(definition, includeComplex, includeArrays, keys, path) {
			var self = this;
			var sort = false;
			if (!keys) {
				keys = [];
				sort = true;
			}
			if (definition && definition.properties) {
				Object.keys(definition.properties).map(function(key) {
					// arrays can not be chosen, you need to bind them first
					// simple arrays are always allowed currently
					if (definition.properties[key].type != "array" || includeArrays || (definition.properties[key].items && !definition.properties[key].items.properties)) {
						var childPath = (path ? path + "." : "") + key;
						var isArray = definition.properties[key].type == "array";
						var isComplex = !!definition.properties[key].properties;
						// if we have an array, it can be a complex array
						if (!isComplex && definition.properties[key].items) {
							isComplex = !!definition.properties[key].items.properties;
						}
						if (includeComplex || !isComplex) {
							keys.push(childPath);
						}
						// if it is complex, recurse
						if (isComplex) {
							if (isArray) {
								// not sure if the ternary is needed, "definition.properties[key].items" should be correct for complex types
								// but for backwards compatibility i don't want to mess it up
								self.getSimpleKeysFor(definition.properties[key].items.properties ? definition.properties[key].items : {properties:definition.properties[key].items}, includeComplex, includeArrays, keys, childPath);
							}
							else {
								self.getSimpleKeysFor(definition.properties[key], includeComplex, includeArrays, keys, childPath);
							}
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
					home: this.home,
					homeUser: this.homeUser,
					properties: self.properties,
					devices: self.devices,
					imports: self.imports,
					googleSiteVerification: self.googleSiteVerification
				}
			});
		},
		listFunctionDefinitions: function() {
			var result = [];
			nabu.utils.arrays.merge(result, this.functions);
			nabu.utils.arrays.merge(result, nabu.page.providers("page-function"));
			return result;
		},
		listFunctions: function(value) {
			var result = this.listFunctionDefinitions().map(function(x) { return x.id });
			return result.filter(function(x) {
				return !value || x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
			});
		},
		getFunctionInput: function(id, value) {
			var transformer = this.$services.page.functions.filter(function(x) { return x.id == id })[0];
			if (!transformer) {
				transformer = nabu.page.providers("page-function").filter(function(x) { return x.id == id })[0];
			}
			var parameters = {};
			var self = this;
			if (transformer && transformer.inputs) {
				transformer.inputs.map(function(x) {
					parameters[x.name] = self.$services.page.getResolvedPageParameterType(x.type);
					if (!parameters[x.name].required && x.required) {
						parameters[x.name].required = x.required;
					}
				});
			}
			return {properties:parameters};
		},
		// really poor naming decisions lead to this...
		getFunctionOutputFull: function(id, value) {
			var transformer = this.$services.page.functions.filter(function(x) { return x.id == id })[0];
			if (!transformer) {
				transformer = nabu.page.providers("page-function").filter(function(x) { return x.id == id })[0];
			}
			var parameters = {};
			var self = this;
			if (transformer && transformer.outputs) {
				transformer.outputs.map(function(x) {
					parameters[x.name] = self.$services.page.getResolvedPageParameterType(x.type);
				});
			}
			return {properties:parameters};
		},
		getFunctionOutput: function(id, value) {
			return this.$services.page.getSimpleKeysFor(this.getFunctionOutputFull(id, value), true, true);
		},
		saveCompiledCss: function() {
			this.$services.swagger.execute("nabu.web.page.core.rest.style.compile", {
				applicationId: this.applicationId,
				body: {
					compiled: this.lastCompiled
				}
			});
		},
		saveFunction: function(transformer) {
			try {
				var result = new Function('input', '$services', '$value', 'resolve', 'reject', transformer.content);
				var parts = transformer.id.split(".");
				var target = window;
				for (var i = 0; i < parts.length - 1; i++) {
					if (!target[parts[i]]) {
						target[parts[i]] = {};
					}
					target = target[parts[i]];
				}
				target[parts[parts.length - 1]] = result;
				// if we get this far, also recompile all transformers
				var compiled = "";
				this.functions.forEach(function(transformer) {
					var parts = transformer.id.split(".");
					// make global namespace
					for (var i = 0; i < parts.length - 1; i++) {
						compiled += "if (!" + parts[i] + ") " + (i == 0 ? "var " : "") + parts[i] + " = {};\n";
					}
					compiled += (parts.length == 1 ? "var " : "") + transformer.id + " = function(input, $services, $value, resolve, reject) {\n";
					compiled += "\t" + transformer.content.replace(/\n/g, "\n\t") + "\n";
					compiled += "}\n";
				});
				compiled += "Vue.service('functionRegistrar', {\n";
				compiled += "	services: ['page'],\n";
				compiled += "	activate: function(done) {\n"
				// we only load the functions if we are not editing, otherwise they are available as per usual
				compiled += "		if (!this.$services.page.editable) {\n";
				this.functions.forEach(function(transformer) {
					compiled += "			nabu.page.provide('page-function', {\n";
					compiled += "				id: '" + transformer.id + "',\n";
					compiled += "				async: " + !!transformer.async + ",\n";
					compiled += "				implementation: " + transformer.id + ",\n";
					compiled += "				inputs: " + (transformer.inputs ? JSON.stringify(transformer.inputs) : []) + ",\n";
					compiled += "				outputs: " + (transformer.inputs ? JSON.stringify(transformer.outputs) : []) + "\n";
					compiled += "			});\n";
				});
				compiled += "		}\n";
				compiled += "		done();\n";
				compiled += "	}\n";
				compiled += "})\n";
				this.$services.swagger.execute("nabu.web.page.core.rest.function.compiled", {body:{content: compiled}});
			}
			catch (exception) {
				this.functionError = exception.message;
				console.error("Could not create function", exception.message);
			}
			return this.$services.swagger.execute("nabu.web.page.core.rest.function.write", { name:transformer.id, body: {content: JSON.stringify(transformer, null, 2) } });
		},
		createFunction: function() {
			var self = this;	
			var name = prompt("Function Id");
			if (name && this.functions.map(function(x) { return x.id.toLowerCase() }).indexOf(name.toLowerCase()) < 0) {
				var transformer = { id:name, inputs:[], outputs:[], content: "" };
				this.saveFunction(transformer).then(function() {
					self.functions.push(transformer);
				});
			}
		},
		createStyle: function() {
			var self = this;
			var name = prompt("Stylesheet Name");
			if (name && this.styles.map(function(x) { return x.name.toLowerCase() }).indexOf(name.toLowerCase()) < 0) {
				this.$services.swagger.execute("nabu.web.page.core.rest.style.write", { name:name, body: { content: "" } }).then(function() {
					self.styles.push({
						name: name,
						content: ""
					});
				});
			}
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
					console.error("Compilation failed", result);
				}
			});
		},
		inject: function(link, callback, async) {
			// only inject it once!
			var existing = document.head.querySelector('script[src="' + link + '"]');
			if (existing) {
				if (callback) {
					callback();
				}
			}
			else {
				var script = document.createElement("script");
				script.setAttribute("src", link);
				script.setAttribute("type", "text/javascript");
				if (async) {
					script.setAttribute("async", "true");
				}
				
				if (callback) {
					// IE (not 11)
					if (script.readyState){  
						script.onreadystatechange = function() {
							if (script.readyState == "loaded" || script.readyState == "complete") {
								script.onreadystatechange = null;
								callback();
							}
						};
					}
					// IE 11?
					else if (script.attachEvent) {
						script.attachEvent("onload", function() {
							callback();
						});
					}
					else if (script.addEventListener) {
						script.addEventListener("load", function() {
							callback();
						});
					}
					// rest
					else { 
						script.onload = function() {
							callback();
						};
					}
				}
				document.head.appendChild(script);
			}
		},
		canEdit: function() {
			return !this.isServerRendering && this.editable;	
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
				page.content = self.normalize({});
			}
			page.content.name = page.name;
			page.marshalled = JSON.stringify(page.content, null, "\t");
			return this.$services.swagger.execute("nabu.web.page.core.rest.page.update", { body: page }).then(function() {
				// add it to the pages if it isn't there yet (e.g. create)
				var index = self.pages.indexOf(page);
				// re-add to trigger a reregister (if necessary)
				if (index >= 0) {
					self.pages.splice(index, 1, page);
				}
				else {
					self.pages.push(page);
				}
			});
		},
		findMain: function(rowHolder) {
			if (rowHolder.rows && rowHolder.rows.length) {
				for (var i = 0; i < rowHolder.rows.length; i++) {
					if (rowHolder.rows[i].customId == "main") {
						return rowHolder.rows[i];
					}
					if (rowHolder.rows[i].cells && rowHolder.rows[i].cells.length) {
						for (var j = 0; j < rowHolder.rows[i].cells.length; j++) {
							var cell = rowHolder.rows[i].cells[j];
							if (cell.customId == "main") {
								return cell;
							}
							else if (cell.rows) {
								var main = this.findMain(cell);
								if (main) {
									return main;
								}
							}
						}
					}
				}
			}
			return null;
		},
		filterRoutes: function(value) {
			if (value != null && value.substring(0, 1) == "=") {
				return [value];
			}
			var routes = this.$services.router.list().filter(function(x) {
				return x.alias && (!value || x.alias.toLowerCase().indexOf(value.toLowerCase()) >= 0);
			});
			routes.sort(function(a, b) {
				return a.alias.localeCompare(b.alias);
			});
			return routes.map(function(x) { return x.alias });
		},
		loadPages: function(pages) {
			var self = this;
			pages.map(function(page) {
				if (!page.content) {
					Vue.set(page, "content", self.normalize(page.marshalled ? JSON.parse(page.marshalled) : {}));
				}
				
				var parameters = {};
				if (page.content.parameters) {
					page.content.parameters.map(function(x) {
						parameters[x.name] = self.getResolvedPageParameterType(x.type);
						// currently we do not want to allow you to map different parts
						if (parameters[x.name].properties) {
							parameters[x.name].properties = {};
						}
					})
				}
				
				var route = {
					alias: self.alias(page),
					url: page.content.initial ? "/.*" : page.content.path,
					query: page.content.query ? page.content.query : [],
					//parameters: page.content.parameters ? page.content.parameters.map(function(x) { return x.name }) : [],
					parameters: parameters,
					enter: function(parameters, mask) {
						if (page.content.initial) {
							var found = !!self.findMain(page.content);
							// check that there is a row/cell with the default anchor, if not, insert it
/*							for (var i = 0; i < page.content.rows.length; i++) {
								if (page.content.rows[i].customId == "main") {
									found = true;
									break;
								}
							}*/
							if (!found) {
								page.content.rows.push({
									id: 0,
									customId: "main",
									cells: [],
									class: null
								});
							}
						}
						return new nabu.page.views.Page({propsData: {page: page, parameters: parameters, stopRerender: parameters ? parameters.stopRerender : false, pageInstanceId: self.pageCounter++, masked: mask }});
					},
					// ability to recognize page routes
					isPage: true,
					initial: page.content.initial,
					roles: page.content.roles != null && page.content.roles.length > 0 ? page.content.roles : null,
					slow: !page.content.initial && page.content.slow,
					parent: page.content.pageParent,
					defaultAnchor: page.content.defaultAnchor
				};
				
				self.$services.router.unregister(self.alias(page));
				self.$services.router.register(route);
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
			if (!route) {
				return result;
			}
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
			if (definition && definition.properties) {
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
		// this simply returns all available parameters, regardless of whether you listen on it or not
		// currently not cell specific, so does not take into account repeats
		getAllAvailableParameters: function(page, context) {
			var result = {};
			
			var self = this;
			if (!context) {
				context = self;
			}
			var pageInstance = self.$services.page.getPageInstance(page, context);
			
			var provided = this.getProvidedParameters();
			Object.keys(provided.properties).map(function(key) {
				result[key] = provided.properties[key];	
			});
			
			var application = this.getApplicationParameters();
			if (Object.keys(application.properties).length) {
				result.application = application;
			}

			// and the page itself
			result.page = this.getPageParameters(page);
			
			// the available state
			page.content.states.map(function(state) {
				if (self.$services.swagger.operation(state.operation).responses && self.$services.swagger.operation(state.operation).responses["200"]) {
					result[state.name] = self.$services.swagger.resolve(self.$services.swagger.operation(state.operation).responses["200"]).schema;
				}
			});
			
			// the available computed
			if (page.content.computed) {
				page.content.computed.map(function(state) {
					if (state.name && state.bindings && state.bindings[state.name] && state.bindings[state.name].label == "$function") {
						var output = self.getFunctionOutputFull(state.bindings[state.name].value);
						if (state.bindings && state.bindings[state.name].output) {
							output = output.properties[state.bindings[state.name].output];
						}
						result[state.name] = output;
					}
				});
			}
			
			// and map all events
			var available = pageInstance.getEvents();
			Object.keys(available).map(function(key) {
				result[key] = available[key];
			});
			
			nabu.page.providers("page-enumerate").forEach(function(x) {
				if (x.enumerate && x.label) {
					var tmp = {};
					var entries = x.enumerate();
					if (entries) {
						entries.forEach(function(y) {
							tmp[y[x.label]] = {
								type: "string"
							};
						});
						result[x.name] = {properties:tmp};
					}
				}
			})
			
			return result;
		},
		getAllAvailableKeys: function(page) {
			var keys = [];
			var self = this;
			var parameters = this.getAllAvailableParameters(page);
			Object.keys(parameters).map(function(key) {
				nabu.utils.arrays.merge(keys, self.getSimpleKeysFor(parameters[key]).map(function(x) {
					return key + "." + x;
				}));
			});
			return keys;
		},
		getAvailableKeys: function(page, cell, includeAllEvents) {
			var keys = [];
			var self = this;
			var parameters = this.getAvailableParameters(page, cell, includeAllEvents);
			Object.keys(parameters).map(function(key) {
				nabu.utils.arrays.merge(keys, self.getSimpleKeysFor(parameters[key]).map(function(x) {
					return key + "." + x;
				}));
			});
			return keys;
		},
		getAvailableParameters: function(page, cell, includeAllEvents) {
			var result = {};

			var self = this;
			var pageInstance = self.$services.page.getPageInstance(page, self);
			
			// the available events
			var available = pageInstance.getEvents();
			if (includeAllEvents) {
				Object.keys(available).map(function(key) {
					result[key] = available[key];
				});
			}
			
			var provided = this.getProvidedParameters();
			Object.keys(provided.properties).map(function(key) {
				result[key] = provided.properties[key];	
			});
			
			var application = this.getApplicationParameters();
			if (Object.keys(application.properties).length) {
				result.application = application;
			}
			
			// and the page itself
			result.page = this.getPageParameters(page);

			// the available state, page state overrides page parameters & application parameters if relevant
			page.content.states.map(function(state) {
				if (state.operation) {
					var operation = self.$services.swagger.operation(state.operation);
					if (operation && operation.responses && operation.responses["200"]) {
						result[state.name] = self.$services.swagger.resolve(operation.responses["200"]).schema;
					}
				}
			});
			
			// the available computed
			if (page.content.computed) {
				page.content.computed.map(function(state) {
					if (state.name && state.bindings && state.bindings[state.name] && state.bindings[state.name].label == "$function") {
						var output = self.getFunctionOutputFull(state.bindings[state.name].value);
						if (state.bindings && state.bindings[state.name].output) {
							output = output.properties[state.bindings[state.name].output];
						}
						result[state.name] = output;
					}
				});
			}
			
			// cell specific stuff overwrites everything else
			if (cell) {
				var targetPath = this.getTargetPath(page.content, cell.id);
				if (targetPath && targetPath.length) {
					targetPath.map(function(part) {
						if (part.on) {
							result[part.on] = available[part.on];
						}
						if (part.instances) {
							Object.keys(part.instances).map(function(key) {
								var array = part.instances[key];
								if (array) {
									var variable = array.substring(0, array.indexOf("."));
									var rest = array.substring(array.indexOf(".") + 1);
									if (result[variable]) {
										result[key] = self.getChildDefinition(result[variable], rest).items;
									}
								}
							})
						}
						if (part.cellState) {
							Object.keys(part.cellState).map(function(key) {
								result[key] = part.cellState[key];
							});
						}
					});
				}
			}

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
			var path = this.getTargetPath(page.content, targetId);
			if (path.length) {
				path.map(function(entry) {
					if (entry.instances) {
						Object.keys(entry.instances).map(function(key) {
							var mapping = entry.instances[key];
							if (mapping) {
								var index = mapping.indexOf(".");
								var variable = mapping.substring(0, index);
								var path = mapping.substring(index + 1);
								var definition = self.getChildDefinition(parameters[variable], path);
								nabu.utils.arrays.merge(arrays, self.getArrays(definition.items).map(function(x) { return key + "." + x }));
							}
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
				var self = this;
				page.content.parameters.map(function(x) {
					/*if (x.type == null || ['string', 'boolean', 'number', 'integer'].indexOf(x.type) >= 0) {
						parameters.properties[x.name] = {
							type: x.type == null ? "string" : x.type
						}
					}
					else {
						parameters.properties[x.name] = self.$services.swagger.resolve(self.$services.swagger.definition(x.type))
					}*/
					parameters.properties[x.name] = self.getResolvedPageParameterType(x.type);
				});
			}
			return parameters;
		},
		// not used atm
		getTranslatableParameters: function(part, translations) {
			if (translations == null) {
				translations = [];
			}
			var self = this;
			if (part.$translations) {
				part.$translations.forEach(function(translation) {
					if (part[translation]) {
						translations.push({
							key: translation,
							value: part[translation]
						});
					}
				});
			}
			Object.keys(part).forEach(function(key) {
				if (key != "$translations" && (!part.$translations || part.$translations.indexOf(key) < 0)) {
					if (typeof(part[key]) == "object") {
						self.getTranslatableParameters(part[key], translations);
					}
					else if (part[key] instanceof Array) {
						part[key].forEach(function(single) {
							if (typeof(single) == "object") {		
								self.getTranslatableParameters(single, translations);
							}
						})
					}
				}
			})
			return translations;
		},
		notify: function(severity, message) {
			this.validations.push({
				severity: severity,
				message: message,
				title: message
			});
		},
		getResolvedPageParameterType: function(type) {
			if (type == null || ['string', 'boolean', 'number', 'integer'].indexOf(type) >= 0) {
				return {type:type == null ? "string" : type};
			}
			else {
				try {
					return this.$services.swagger.resolve(this.$services.swagger.definition(type));
				}
				catch (exception) {
					this.notify("error", "Could not resolve type: " + type);
					return {type: "string"};
				}
			}
		},
		getApplicationParameters: function() {
			var parameters = {
				properties: {}
			};
			// and you can set parameters at the web application level that are accessible to any page
			this.properties.map(function(property) {
				parameters.properties[property.key] = property;
			});
			return parameters;
		},
		getProvidedParameters: function() {
			var parameters = {
				properties: {}
			};
			nabu.page.providers("page-bindings").map(function(provider) {
				var result = provider();
				if (result && result.definition) {
					Object.keys(result.definition).map(function(key) {
						parameters.properties[key] = result.definition[key];	
					});
				}
			});
			return parameters;
		},
		// retrieves the path of rows/cells to get to the targetId, this can be used to resolve instances for example
		getTargetPath: function(rowContainer, targetId, recursive) {
			// when we explode for example cells in a loop, the id is further finetuned, for example the original cell might have id "2", the exploded will have "2-1", "2-2" etc to guarantee in-document uniqueness
			if (typeof(targetId) == "string" && targetId.indexOf("-") > 0) {
				targetId = targetId.substring(0, targetId.indexOf("-"));
			}
			var reverse = false;
			if (!recursive) {
				recursive = true;
				// we manage the complete path at this level, reverse when everything is done as the path contains everything in the reverse order
				reverse = true;
			}
			var self = this;
			var path = null;
			if (rowContainer.rows) {
				for (var i = 0; i < rowContainer.rows.length; i++) {
					path = [];
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
								var subPath = self.getTargetPath(cell, targetId, recursive);
								if (subPath && subPath.length) {
									nabu.utils.arrays.merge(path, subPath);
									path.push(cell);
									path.push(row);
								}
							}
							if (path.length) {
								break;
							}
						}
					}
					if (path.length) {
						break;
					}
				}
			}
			if (path && reverse) {
				path.reverse();
			}
			return path;
		},
		getSwaggerParametersAsKeys: function(operation) {
			var self = this;
			var keys = [];
			if (operation) {
				operation.parameters.map(function(parameter) {
					if (parameter.in == "body") {
						var type = self.$services.swagger.resolve(parameter);
						if (type.schema.properties) {
							nabu.utils.arrays.merge(keys, self.getSimpleKeysFor(type.schema).map(function(x) { return "body." + x }));
						}
					}
					else {
						keys.push(parameter.name);
					}
				});
			}
			return keys;
		},
		registerHome: function(home, homeUser) {
			this.$services.router.unregister("home");
			var self = this;
			this.$services.router.register({
				alias: "home",
				enter: function(parameters) {
					// the timeout disconnects the reroute from the current flow
					// otherwise weird things happen
					setTimeout(function() {
						if (homeUser && self.$services.user.loggedIn) {
							self.$services.router.route(homeUser, parameters);
						}
						else if (home) {
							self.$services.router.route(home, parameters);
						}
						else {
							self.$services.router.route("login", parameters);
						}
					}, 1)
				},
				url: "/",
				priority: 1
			});
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
		},
		home: function(newValue) {
			if (newValue && !this.loading) {
				this.registerHome(newValue, this.homeUser);
			}
		},
		homeUser: function(newValue) {
			if (newValue && !this.loading) {
				this.registerHome(this.home, newValue);
			}
		}
	}
}), { name: "nabu.page.services.Page" });
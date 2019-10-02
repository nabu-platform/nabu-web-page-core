if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }
if (!nabu.page.mixins) { nabu.page.mixins = {} }

// on created, we want to inject the state of the page into this component so we can access all the data
Vue.mixin({
	props: {
		localState: {
			type: Object,
			required: false
		},
		pageInstanceId: {
			type: Number,
			required: false
		}
	},
	data: function() {
		return {
			state: {},
			runtimeId: null
		}
	},
	// not ideal, can it be replaced everywhere with $services.page.getBindingValue() ?
	beforeMount: function() {
		var self = this;
		// map any local state
		if (this.localState) {
			Object.keys(this.localState).map(function(key) {
				Vue.set(self.state, key, self.localState[key]);
			});
		}
		if (this.page) {
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			// when creating the actual page, we do not have an instance yet!
			// nor is it important...
			if (pageInstance) {
				Object.keys(pageInstance.variables).map(function(key) {
					if (typeof(self.state[key]) == "undefined") {
						Vue.set(self.state, key, pageInstance.variables[key]);
					}
				})
				var page = this.$services.page.getPageParameterValues(this.page, pageInstance);
				if (Object.keys(page).length) {
					Vue.set(self.state, "page", page);
				}
			}
			var application = {};
			if (this.$services.page.title) {
				application.title = this.$services.page.title;
			}
			this.$services.page.properties.map(function(x) {
				application[x.key] = x.value;
			});
			Vue.set(self.state, "application", application);
		}
	},
	computed: {
		$self: function() {
			return this;
		}	
	},
	methods: {
		$value: function(path) {
			if (this.page) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				return this.$services.page.getBindingValue(pageInstance, path);
			}
		}
	}
})

// methods in cell instances:
// - configure: start configuration for the cell content
// - getEvents: return event definitions
// - getLocalState: return the state definition for this level (e.g. because of for loop or variable scoping)
nabu.page.views.Page = Vue.component("n-page", {
	template: "#nabu-page",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false,
			default: function() { return {} }
		},
		embedded: {
			type: Boolean,
			required: false
		},
		editable: {
			type: Boolean,
			required: false
		},
		masked: {
			typed: Boolean,
			required: false
		},
		stopRerender: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	activate: function(done) {
		// the page has a path, set it in the body so we can do additional stuff
		// in the beginning we set this in the ready hook, however if you have a slow loading page it would only get set after the slow thingy ended
		// however in the mean time your (presumably synchronous) skeletons have already loaded and perhaps even showing a nice loading icon but on the "old" background styling
		if (this.page.content.path)	{
			document.body.setAttribute("page", this.page.name);
			document.body.setAttribute("category", this.page.content.category);
			document.body.setAttribute("page-type", this.page.content.pageType ? this.page.content.pageType : "page");
		}
		
		var self = this;
		var finalize = function() {
			if (self.page.content.title) {
				self.oldTitle = document.title;
				document.title = self.$services.page.translate(self.$services.page.interpret(self.page.content.title, self));
			}
			if (self.page.content.autoRefresh) {
				self.autoRefreshTimeout = setTimeout(function() {
					if (!self.edit && !self.$services.page.wantEdit) {
						var target = nabu.utils.router.self(self.$el);
						console.log("routing in", target);
						//window.history.go(0);
						self.$services.router.route(self.$services.page.alias(self.page), self.parameters, target);
					}
				}, parseInt(self.page.content.autoRefresh));
			}
			done();
		};
		if (this.page.content.states.length) {
			var promises = this.page.content.states.map(function(state) {
				var parameters = {};
				Object.keys(state.bindings).map(function(key) {
					//parameters[key] = self.get(state.bindings[key]);
					if (state.bindings[key] != null) {
						parameters[key] = self.$services.page.getBindingValue(self, state.bindings[key]);
					}
				});
				try {
					// can throw hard errors
					return self.$services.swagger.execute(state.operation, parameters).then(function(result) {
						Vue.set(self.variables, state.name, result ? result : null);
					});
				}
				catch (exception) {
					console.error("Could not execute", state.operation, exception);
					var promise = self.$services.q.defer();
					promise.reject(exception);
					return promise;
				}
			});
			var inSelf = this.page.content.errorInSelf;
			var routeError = function(error, counter) {
				if (!counter) {
					counter = 1;
				}
				if (!self.$el && counter < 5 && inSelf) {
					Vue.nextTick(function() {
						routeError(error, counter + 1);
					});
				}
				else {
					// masked route so we can reload
					self.$services.router.route("error", {
						code: "page-load-failed",
						message: "%{error:The page you requested could not be loaded, please <a href='javascript:void(0)' @click='$window.location.reload()'>try again</a>}"
					}, inSelf && self.$el ? nabu.utils.router.self(self.$el) : null, true);
				}
			};
			this.$services.q.all(promises).then(finalize, function(error) {
				done();
				// if we are in edit mode, we can be expected to fix this
				if (self.edit || self.$services.page.wantEdit) {
					finalize();
				}
				else {
					routeError(error, 0);
				}
			});
		}
		else {
			finalize();
		}
	},
	beforeDestroy: function() {
		if (this.autoRefreshTimeout) {
			clearTimeout(this.autoRefreshTimeout);
			this.autoRefreshTimeout = null;
		}
		if (this.oldTitle) {
			document.title = this.oldTitle;
		}	
	},
	mounted: function() {
		console.log("mounted page", this.page.name, this.embedded);
	},
	created: function() {
		console.log("creating page", this.page.name, this.stopRerender);
		this.$services.page.setPageInstance(this.page, this);
		var self = this;
		if (this.page.content.parameters) {
			this.page.content.parameters.map(function(x) {
				if (x.name != null) {
					// if it is not passed in as input, we set the default value
					if (self.parameters[x.name] == null) {
						// check if we have a content setting
						var value = self.$services.page.getContent(x.global ? null : self.page.name, x.name);
						if (value == null) {
							value = self.$services.page.interpret(x.default, self);
						}
						else {
							value = value.content;
						}
						Vue.set(self.variables, x.name, value == null ? null : value);
					}
					// but you can override the default with an input parameter
					else {
						Vue.set(self.variables, x.name, self.parameters[x.name]);
					}
				}
			});
		}
		if (this.editable) {
			this.edit = true;
		}
		
		if (!this.embedded) {
			// initialize plugins
			this.plugins.forEach(function(plugin) {
				var component = Vue.component(plugin.component);
				new component({propsData: {
					page: self.page,
					edit: self.edit,
					instance: self
				}});
			});
		}
	},
	beforeMount: function() {
		this.$services.page.setPageInstance(this.page, this);
		// keep a stringified copy of the last parameters so we can diff
		this.lastParameters = JSON.stringify(this.parameters);
	},
	destroyed: function() {
		this.$services.page.destroyPageInstance(this.page, this);
	},
	computed: {
		events: function() {
			return this.getEvents();
		},
		availableParameters: function() {
			return this.$services.page.getAvailableParameters(this.page, null, true);
			// there are all the events
			//var available = nabu.utils.objects.clone(this.getEvents());
			// and the page
			//available.page = this.$services.page.getPageParameters(this.page);
			//return available;
		},
		classes: function() {
			var classes = [];
			if (this.edit) {
				classes.push("edit");
			}
			if (this.page.content.class) {
				classes.push(this.page.content.class);
			}
			if (this.page.content.pageType) {
				classes.push("page-type-" + this.page.content.pageType);
			}
			else {
				classes.push("page-type-page");
			}
			classes.push("page-" + this.page.name);
			return classes;
		},
		plugins: function() {
			return nabu.page.providers("page-plugin").filter(function(x) { return x.target == "page" });
		}
	},
	data: function() {
		return {
			autoRefreshTimeout: null,
			refs: {},
			edit: false,
			// contains all the component instances
			// the key is their id
			components: {},
			// contains (amongst other things) the event instances
			variables: {},
			lastParameters: null,
			configuring: false,
			// per cell
			closed: {},
			// centralized storage that exists for the lifetime of the page
			storage: {},
			// subscriptions to events
			subscriptions: {},
			autoMapFrom: null,
			
			// a lot of components load events at the beginning on startup in a computed property
			// however, depending on the mount order, new events come in after those components are started
			// to be able to recompute those events, this should be reactive
			cachedEvents: null,
			// a timer for content saving, we want to batch content updates to prevent a lot of calls
			// the form sets value by value using standard interfaces, it doesn't know that the content is being pushed to the backend
			// we want to keep it that way, which is why it is unaware of the batch
			saveContentTimer: null,
			// the actual contents to save
			saveContents: [],
			savePageTimer: null
		}
	},
	methods: {
		validateStateName: function(name) {
			var blacklisted = ["page", "application", "record", "state", "localState"];
			var messages = [];
			if (name && blacklisted.indexOf(name) >= 0) {
				messages.push({
					type: "error",
					title: "%{This name is not allowed}"
				});
			}
			return messages;
		},
		isGet: function(operationId) {
			var operation = this.$services.swagger.operations[operationId];
			return operation && operation.method && operation.method.toLowerCase() == "get";
		},
		getParameterTypes: function(value) {
			var types = ['string', 'boolean', 'number', 'integer'];
			nabu.utils.arrays.merge(types, Object.keys(this.$services.swagger.swagger.definitions));
			if (value) {
				types = types.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			return types;
		},
		store: function(key, value) {
			if (typeof(value) == "object") {
				if (!this.storage[key]) {
					Vue.set(this.storage, key, {});
				}
				Object.keys(value).map(function(name) {
					Vue.set(this.storage[key], name, value[name]);
				})
			}
			else {
				Vue.set(this.storage, key, value);
			}
		},
		retrieve: function(key) {
			return this.storage[key];
		},
		automap: function(action) {
			var source = this.availableParameters[this.autoMapFrom];
			var self = this;
			this.getOperationParameters(action.operation, true).map(function(key) {
				// only automap those that are not filled in
				if (!action.bindings[key]) {
					var keyToCheck = key.indexOf(".") < 0 ? key : key.substring(key.indexOf(".") + 1);
					if (!!source.properties[keyToCheck]) {
						Vue.set(action.bindings, key, self.autoMapFrom + "." + keyToCheck);
					}
				}
			});
		},
		pasteRow: function() {
			this.page.content.rows.push(this.$services.page.renumber(this.page, this.$services.page.copiedRow));
			this.$services.page.copiedRow = null;
		},
		filterRoutes: function(value) {
			var routes = this.$services.router.list().filter(function(x) {
				return x.alias && (!value || x.alias.toLowerCase().indexOf(value.toLowerCase()) >= 0);
			});
			routes.sort(function(a, b) {
				return a.alias.localeCompare(b.alias);
			});
			return routes.map(function(x) { return x.alias });
		},
		getStateOperations: function(value) {
			var self = this;
			return Object.keys(this.$services.swagger.operations).filter(function(operationId) {
				if (value && operationId.toLowerCase().indexOf(value.toLowerCase()) < 0) {
					return false;
				}
				var operation = self.$services.swagger.operations[operationId];
				// must be a get
				return operation.method.toLowerCase() == "get"
					// and contain the name fragment (if any)
					&& (!name || operation.id.toLowerCase().indexOf(name.toLowerCase()) >= 0)
					// must have _a_ response
					&& operation.responses["200"];
			});
		},
		setStateOperation: function(state, operation) {
			state.operation = operation;
			var bindings = {};
			if (operation) {
				this.$services.swagger.operations[operation].parameters.map(function(parameter) {
					bindings[parameter.name] = null;
				});
			}
			Vue.set(state, "bindings", bindings);
		},
		addState: function() {
			this.page.content.states.push({
				name: null,
				operation: null,
				bindings: {}
			})	
		},
		dragMenu: function(event) {
			event.dataTransfer.setData("page-menu", this.page.name);	
		},
		dragOver: function(event) {
			// do nothing?
		},
		dropMenu: function(event) {
			event.preventDefault();
			event.stopPropagation();
			var rect = this.$el.getBoundingClientRect();
			Vue.set(this.page.content, "menuX", event.clientX - rect.left);
			Vue.set(this.page.content, "menuY", event.clientY - rect.top);
			this.$services.page.update(this.page);
		},
		getOperationParameters: function(operation, explode) {
			// could be an invalid operation?
			if (!this.$services.swagger.operations[operation]) {
				 return [];
			}
			var parameters = this.$services.swagger.operations[operation].parameters;
			if (explode) {
				return this.$services.page.getSwaggerParametersAsKeys(this.$services.swagger.operations[operation]);
			}
			else {
				return parameters ? parameters.map(function(x) { return x.name }) : [];
			}
		},
		addEventReset: function(action) {
			if (action.eventResets == null) {
				Vue.set(action, "eventResets", []);
			}
			action.eventResets.push('');
		},
		getOperations: function(value) {
			var options = Object.keys(this.$services.swagger.operations);
			if (value) {
				options = options.filter(function(x) {
					return x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				})
			}
			return options;
		},
		getAvailableEvents: function(event) {
			var available = this.getEvents();
			var result = Object.keys(available);
			if (event) {
				result = result.filter(function(x) {
					return x.toLowerCase().indexOf(event.toLowerCase()) >= 0;
				});
			}
			result.sort();
			return result;
		},
		addAction: function() {
			this.page.content.actions.push({
				name: null,
				on: null,
				confirmation: null,
				operation: null,
				route: null,
				event: null,
				anchor: null,
				bindings: {},
				expandBindings: true
			});
		},
		removeQuery: function(index) {
			this.page.content.query.splice(index, 1);	
		},
		ref: function(reference) {
			return this.refs[reference];
		},
		mounted: function(cell, row, state, component) {
			var self = this;
			
			if (cell.ref) {
				this.refs[cell.ref] = component;
			}
			
			component.$on("hook:beforeDestroy", function() {
				// clear subscriptions
				if (component.$pageSubscriptions != null) {
					console.log("clearing subscriptions", component.$pageSubscriptions);
					component.$pageSubscriptions.forEach(function(sub) {
						sub();
					});
				}
				if (cell.ref) {
					self.refs[cell.ref] = null;
				}
				self.$services.page.destroy(component);
			});
			
			// reset event cache
			this.cachedEvents = null;
			this.components[cell.id] = component;
			
			// we subscribe to a very specific event that will reset all the registered events
			// this is because it is cached...
			component.$on("updatedEvents", function() {
				self.resetEvents();
			});
			
			// we want to inject all the data into the component so it can be used easily
			var data = {};
			// shallow copy of the variables that exist
			var self = this;
			Object.keys(this.variables).map(function(key) {
				data[key] = self.variables[key];
			});
			
			// actually, the state is not in the parents as rows and cells are not components
			// state is sent in
			/*
			// now we want to walk the parent nodes of the component until we reach the page
			// and check if they have any local state that should be added
			// parents can override page-level properties but because we loop from closest parent to furthest parent, they can not override each others keys
			// as the most specific parent is supposed to win
			var parentKeys = [];
			var parent = component.$parent;
			while (parent) {
				if (parent == this) {
					break;
				}
				if (parent.data) {
					Object.keys(parent.data).map(function(key) {
						if (parentKeys.indexOf(key) < 0) {
							data[key] = parent.data[key];
							parentKeys.push(key);
						}
					})
				}
				parent = parent.$parent;
			}
			*/
			
			if (state) {
				Object.keys(state).map(function(key) {
					data[key] = state[key];
				})
			}
			
			// we want to inject all the necessary data into the cell so it can be referenced by components
//			Vue.set(component, "state", data);
		
			// make sure we have a watchable variable for each event
			if (component.getEvents) {
				var self = this;
				Object.keys(component.getEvents()).map(function(name) {
					if (!self.variables[name]) {
						Vue.set(self.variables, name, null);
					}
					component.$on(name, function(value) {
						self.emit(name, value);
					});
				})
			}
			
			// if we have old-timey event registration, use it to pick up page events
			if (component.$options.events) {
				if (component.$pageSubscriptions == null) {	
					component.$pageSubscriptions = [];
				}
				var self = this;
				Object.keys(component.$options.events).forEach(function(name) {
					console.log("subscribing to", name);
					component.$pageSubscriptions.push(self.subscribe(name, component.$options.events[name].bind(component)));
				});
			}
		},
		hasConfigureListener: function(rows) {
			if (!rows) {
				rows = this.page.content.rows;
			}
			if (rows) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].on == "$configure") {
						return true;
					}
					if (rows[i].cells) {
						for (var j = 0; j < rows[i].cells.length; j++) {
							var cell = rows[i].cells[j];
							if (cell.on == "$configure") {
								return true;
							}
							if (cell.rows) {
								var has = this.hasConfigureListener(cell.rows);
								if (has) {
									return true;
								}
							}
						}
					}
				}
			}
			return false;
		},
		addRow: function() {
			this.page.content.rows.push({
				id: this.page.content.counter++,
				cells: [],
				class: null,
				customId: null,
				instances: {},
				condition: null,
				direction: null,
				align: null,
				on: null,
				collapsed: false,
				name: null
			});
		},
		addPageParameter: function() {
			if (!this.page.content.parameters) {
				Vue.set(this.page.content, "parameters", []);
			}
			this.page.content.parameters.push({
				name: null,
				type: 'string',
				format: null,
				default: null,
				global: false,
				// we can listen to events and take a value from them to update the current value
				// e.g. we could update a search parameter if you select something
				listeners: []
			});
		},
		removeRow: function(row) { 
			this.page.content.rows.splice(this.page.content.rows(indexOf(row), 1))
		},
		resetEvents: function() {
			this.cachedEvents = null;
		},
		getEvents: function() {
			// non-watched cache property
			// we have too many problems with update loops that are triggered by this method
			// and in general the result should only change if we route new content
			if (!this.cachedEvents) {
				var events = {
					"$configure": {properties:{}}
				};
				
				var self = this;
				this.cachedEvents = events;
				
				// check which events are picked up globally
				if (this.page.content.globalEventSubscriptions) {
					var globalEventDefinitions = this.$services.page.getGlobalEvents();
					console.log("global events", JSON.stringify(globalEventDefinitions, null, 2));
					this.page.content.globalEventSubscriptions.map(function(sub) {
						console.log("wtf", sub.globalName, sub.localName, globalEventDefinitions[sub.globalName]);
						events[sub.localName == null ? sub.globalName : sub.localName] = globalEventDefinitions[sub.globalName] ? globalEventDefinitions[sub.globalName] : {properties:{}};	
					});
				}
				
				// your page actions can trigger success events
				if (this.page.content.actions) {
					this.page.content.actions.filter(function(x) { return x.event != null && x.operation != null }).map(function(action) {
						if (self.$services.swagger.operations[action.operation] == null) {
							console.error("Could not find operation for action", action.operation, action.name, action.event);
						}
						else {
							var response = self.$services.swagger.operations[action.operation].responses["200"];
							var schema = null;
							if (response && response.schema) {
								schema = self.$services.swagger.resolve(response.schema);
							}
							events[action.event] = schema ? schema : {};
						}
					});
					this.page.content.actions.filter(function(x) { return x.errorEvent != null && x.operation != null }).map(function(action) {
						events[action.errorEvent] = self.$services.swagger.resolve("#/definitions/StructuredErrorResponse");
					});
				}
				
				// add the cell events
				this.page.content.rows.map(function(row) {
					self.getCellEvents(row, events);
				});
				
				Object.keys(this.components).map(function(cellId) {
					var component = self.components[cellId];
					if (component && component.getEvents) {
						var cellEvents = component.getEvents();
						if (cellEvents) {
							Object.keys(cellEvents).map(function(key) {
								events[key] = cellEvents[key];
							});
						}
					}
				});
				Object.keys(events).map(function(name) {
					// because events can reference one another in circular fashion, we allow for event references
					// this means if the value is a string rather than an array of fields, we assume it is the name of another event and we should use those parameters
					if (typeof(events[name]) == "string") {
						if (events[events[name]]) {
							events[name] = events[events[name]];
						}
						else {
							console.warn("Can not find event: " + events[events[name]]);
							events[name] = {};
						}
					}
				});
			}
			return this.cachedEvents;
		},
		getCellEvents: function(cellContainer, events) {
			var self = this;
			if (cellContainer.cells) {
				cellContainer.cells.map(function(cell) {
					if (cell.clickEvent) {
						events[cell.clickEvent] = {};
					}
					if (cell.rows) {
						cell.rows.map(function(row) {
							self.getCellEvents(row, events);
						});
					}
				});
			}
		},
		subscribe: function(event, handler) {
			if (!this.subscriptions[event]) {
				this.subscriptions[event] = [];
			}
			this.subscriptions[event].push(handler);
			var self = this;
			return function() {
				self.subscriptions[event].splice(self.subscriptions[event].indexOf(handler), 1);
			};
		},
		reset: function(name) {
			Vue.delete(this.variables, name);
		},
		emit: function(name, value) {
			var self = this;

			// used to be a regular assign and that seemed to work as well?
			Vue.set(this.variables, name, value);
			
			// check parameters that may listen to the given value
			if (this.page.content.parameters) {
				this.page.content.parameters.map(function(parameter) {
					parameter.listeners.map(function(listener) {
						var parts = listener.split(".");
						// we are setting the variable we are interested in
						if (parts[0] == name) {
							var interested = self.get(listener);
							if (!interested) {
								Vue.delete(self.variables, parameter.name);
							}
							else {
								Vue.set(self.variables, parameter.name, interested);
							}
						}
					})
				})
			}
			
			var promises = [];
			
			// check all the actions to see if we need to run something
			this.page.content.actions.map(function(action) {
				
				if (action.on == name) {
					var promise = self.$services.q.defer();
					
					var runFunction = function() {
						if (action.isSlow) {
							self.$wait({promise: promise});
						}
						var func = self.$services.page.getRunnableFunction(action.function);
						if (!func) {
							throw "Could not find function: " + action.function; 
						}
						var input = {};
						if (action.bindings) {
							var pageInstance = self;
							Object.keys(action.bindings).forEach(function(key) {
								if (action.bindings[key]) {
									var value = self.$services.page.getBindingValue(pageInstance, action.bindings[key], self);
									self.$services.page.setValue(input, key, value);
								}
							});
						}
						return self.$services.page.runFunction(func, input, self, promise);
					}
					
					promises.push(promise);
					var parameters = {};
					Object.keys(action.bindings).map(function(key) {
						self.$services.page.setValue(parameters, key, self.$services.page.getBindingValue(self, action.bindings[key]));
					});
					
					var eventReset = function() {
						if (action.eventResets != null) {
							action.eventResets.forEach(function(event) {
								self.emit(event, null);
							});
						}
					};
					
					var date = new Date();
					var stop = function(error) {
						if (self.$services.analysis && self.$services.analysis.emit && action.name) {
							self.$services.analysis.emit("trigger-" + self.page.name, action.name, 
								{time: new Date().getTime() - date.getTime(), error: error}, true);
						}
					};
					
					promise.then(function() { stop() }, function(error) { stop(error) });
					
					if (action.confirmation) {
						self.$confirm({message:self.$services.page.translate(action.confirmation)}).then(function() {
							var element = null;
							var async = false;
							// already get the element, it can be triggered with or without a route
							if (action.scroll) {
								var element = document.querySelector(action.scroll);
								if (!element) {
									element = document.getElementById(action.scroll);
								}
							}
							if (action.url) {
								var url = self.$services.page.interpret(action.url, self);
								if (action.anchor) {
									window.open(url);
								}
								else {
									window.location = url;
								}
							}
							else if (action.route) {
								var routePromise = null;
								eventReset();
								if (action.anchor == "$blank") {
									window.open(self.$services.router.template(action.route, parameters));
								}
								else if (action.anchor == "$window") {
									window.location = self.$services.router.template(action.route, parameters);
								}
								else {
									routePromise = self.$services.router.route(action.route, parameters, action.anchor ? action.anchor : null, action.anchor ? true : false);
								}
								if (element) {
									if (routePromise && routePromise.then) {
										routePromise.then(function() {
											element.scrollIntoView();
										});
									}
									else {
										element.scrollIntoView();
									}
								}
							}
							else if (action.scroll) {
								eventReset();
								if (element) {
									element.scrollIntoView();
								}
							}
							else if (action.operation && self.isGet(action.operation) && action.anchor == "$blank") {
								window.open(self.$services.swagger.parameters(action.operation, parameters).url, "_blank");
							}
							else if (action.operation) {
								if (action.isSlow) {
									self.$wait({promise: promise});
								}
								var operation = self.$services.swagger.operations[action.operation];
								if (operation.method == "get" && operation.produces && operation.produces.length && operation.produces[0] == "application/octet-stream") {
									window.location = self.$services.swagger.parameters(action.operation, parameters).url;
									eventReset();
								}
								else {
									async = true;
									self.$services.swagger.execute(action.operation, parameters).then(function(result) {
										if (action.event) {
											// we get null from a 204
											self.emit(action.event, result == null ? {} : result);
										}
										eventReset();
										promise.resolve(result);
									}, function(error) {
										if (action.errorEvent) {
											self.emit(action.errorEvent, error);
										}
										promise.reject(error);
									});
								}
							}
							else if (action.function) {
								runFunction();
							}
							else {
								eventReset();
							}
							if (!async) {
								promise.resolve();
							}
						}, function() {
							promise.reject();
						})
					}
					else {
						var async = false;
						if (action.url) {
							var url = self.$services.page.interpret(action.url, self);
							if (action.anchor) {
								window.open(url);
							}
							else {
								window.location = url;
							}
						}
						else if (action.scroll) {
							eventReset();
							var element = document.querySelector(action.scroll);
							if (!element) {
								element = document.getElementById(action.scroll);
							}
							if (element) {
								element.scrollIntoView();
							}
						}
						else if (action.route) {
							eventReset();
							if (action.anchor == "$blank") {
								window.open(self.$services.router.template(action.route, parameters));
							}
							else if (action.anchor == "$window") {
								window.location = self.$services.router.template(action.route, parameters);
							}
							else {
								self.$services.router.route(action.route, parameters, action.anchor ? action.anchor : null, action.anchor ? true : false);
							}
						}
						else if (action.operation && self.isGet(action.operation) && action.anchor == "$blank") {
							window.open(self.$services.swagger.parameters(action.operation, parameters).url, "_blank");
						}
						else if (action.operation) {
							if (action.isSlow) {
								self.$wait({promise: promise});
							}
							var operation = self.$services.swagger.operations[action.operation];
							if (operation.method == "get" && operation.produces && operation.produces.length && operation.produces[0] == "application/octet-stream") {
								window.location = self.$services.swagger.parameters(action.operation, parameters).url;
								eventReset();
							}
							else {
								async = true;
								self.$services.swagger.execute(action.operation, parameters).then(function(result) {
									if (action.event) {
										// we get null from a 204
										self.emit(action.event, result == null ? {} : result);
									}
									eventReset();
									promise.resolve(result);
								}, function(error) {
									if (action.errorEvent) {
										self.emit(action.errorEvent, error);
									}
									promise.reject(error);
								});
							}
						}
						else if (action.function) {
							runFunction();
						}
						else {
							eventReset();
						}
						if (!async) {
							promise.resolve();
						}
					}
				}
			});
			
			if (this.subscriptions[name]) {
				this.subscriptions[name].map(function(handler) {
					var result = handler(value);
					if (result && result.then) {
						promises.push(result);
					}
				});
			}
			
			// check states that have to be refreshed
			if (this.page.content.states.length) {
				nabu.utils.arrays.merge(promises, this.page.content.states.filter(function(x) { return x.refreshOn != null && x.refreshOn.indexOf(name) >= 0 }).map(function(state) {
					var parameters = {};
					Object.keys(state.bindings).map(function(key) {
						parameters[key] = self.get(state.bindings[key]);
					});
					try {
						// can throw hard errors
						return self.$services.swagger.execute(state.operation, parameters).then(function(result) {
							if (self.variables[state.name] != null) {
								if (self.variables[state.name] instanceof Array) {
									self.variables[state.name].splice(0);
									if (result instanceof Array) {
										nabu.utils.arrays.merge(self.variables[state.name], result);
									}
									else {
										self.variables[state.name].push(result);
									}
								}
								else {
									var resultKeys = Object.keys(result);
									Object.keys(self.variables[state.name]).forEach(function(key) {
										if (resultKeys.indexOf(key) < 0) {
											self.variables[state.name] = null;
										}
									});
									// make sure we use vue.set to trigger other reactivity
									resultKeys.forEach(function(key) {
										Vue.set(self.variables[state.name], key, result[key]);
									});
									// TODO: do a proper recursive merge to maintain reactivity with deeply nested
									
									//nabu.utils.objects.merge(self.variables[state.name], result);
								}
							}
							else {
								Vue.set(self.variables, state.name, result ? result : null);
							}
						});
					}
					catch (exception) {
						console.error("Could not execute", state.operation, exception);
						var promise = self.$services.q.defer();
						promise.reject(exception);
						return promise;
					}
				}));
			}
			
			// remove all the closed stuff for this event, we may want to reopen something
			Object.keys(this.closed).map(function(key) {
				if (self.closed[key] == name) {
					Vue.set(self.closed, key, null);
				}
			});
			return this.$services.q.all(promises).then(function() {
				if (self.page.content.globalEvents) {
					var globalEvent = self.page.content.globalEvents.filter(function(x) {
						return x.localName == name;
					})[0];
					if (globalEvent) {
						self.$services.page.emit(globalEvent.globalName ? globalEvent.globalName : name, value, self);
					}
				}
			});
		},
		addGlobalEvent: function() {
			if (!this.page.content.globalEvents) {
				Vue.set(this.page.content, "globalEvents", []);
			}
			this.page.content.globalEvents.push({localName: null, globalName: null});
		},
		addGlobalEventSubscription: function() {
			if (!this.page.content.globalEventSubscriptions) {
				Vue.set(this.page.content, "globalEventSubscriptions", []);
			}
			this.page.content.globalEventSubscriptions.push({localName: null, globalName: null});
		},
		get: function(name) {
			// probably not filled in the value yet
			if (!name) {
				return null;
			}
			if (name == "page") {
				return this.parameters;
			}
			else if (name == "application.title") {
				return this.$services.page.title;
			}
			else if (name.indexOf("application.") == 0) {
				var name = name.substring("application.".length);
				var value = this.$services.page.properties.filter(function(x) {
					return x.key == name;
				})[0];
				return value ? value.value : null;
			}
			else if (name.indexOf("page.") == 0) {
				var name = name.substring("page.".length);
				var dot = name.indexOf(".");
				var localName = dot >= 0 ? name.substring(0, dot) : name;
				var relativeName = dot >= 0 ? name.substring(dot + 1) : null;
				var applicationProperty = this.$services.page.properties.filter(function(property) {
					return property.key == localName;
				})[0];
				var pageParameter = this.page.content.parameters ? this.page.content.parameters.filter(function(parameter) {
					return parameter.name == localName;
				})[0] : null;
				
				var result = null;
				if (applicationProperty) {
					result = applicationProperty.value;
				}
				else if (pageParameter != null) {
					result = this.variables[pageParameter.name];
				}
				else {
					result = this.parameters[name];
				}
				if (result != null && relativeName != null) {
					var parts = relativeName.split(".");
					for (var i = 0; i < parts.length; i++) {
						result = result[parts[i]];
						if (result == null) {
							break;
						}
					}
				}
				return result;
			}
			// we want an entire variable
			else if (name.indexOf(".") < 0) {
				return this.variables[name];
			}
			// we still want an entire variable
			else if (name.indexOf(".$all") >= 0) {
				return this.variables[name.substring(0, name.indexOf(".$all"))];
			}
			else {
				var parts = name.split(".");
				if (this.variables[parts[0]]) {
					var value = this.variables[parts[0]];
					for (var i = 1; i < parts.length; i++) {
						if (value) {
							if (value instanceof Array) {
								value = value.map(function(x) { return x[parts[i]] });
							}
							else {
								value = value[parts[i]];
							}
						}
					}
					return value;
				}
				else {
					var result = null;
					// check if there is a provider for it
					nabu.page.providers("page-bindings").map(function(provider) {
						var provided = provider();
						if (Object.keys(provided.definition).indexOf(parts[0]) >= 0) {
							result = provided.resolve(name.substring(name.indexOf(".") + 1));
						}
					});
					return result;
				}
			}
		},
		saveTranslatedContent: function(content) {
			if (this.saveContentTimer) {
				clearTimeout(this.saveContentTimer);
				this.saveContentTimer = null;
			}
			this.saveContents.push(content);
			var self = this;
			this.saveContentTimer = setTimeout(function() {
				var contents = self.saveContents.splice(0);
				var save = function() {
					self.$services.swagger.execute("nabu.web.page.core.rest.configuration.updateContent", {
						body: {
							contents: contents
						}
					}).then(function(response) {
						// do nothing
					}, function(error) {
						self.$confirm({
							message: "Your content could not be saved, do you want to try again?"
						}).then(save)
					});
				};
				save();
			}, 300);
		},
		savePage: function() {
			if (this.savePageTimer) {
				clearTimeout(this.savePageTimer);
				this.savePageTimer = null;
			}
			var self = this;
			this.savePageTimer = setTimeout(function() {
				self.$services.page.update(self.page);
			}, 300);
		},
		isDevelopment: function() {
			return ${environment("development")};	
		},
		hasLanguageSet: function() {
			// the current value can be automatically deduced from the browser settings instead of an active choice by the user
			// the cookieValue is only present if the user has actively chosen a language so check that to allow "unsetting" of the value for json manipulation
			return this.$services.language.current && this.$services.language.cookieValue;
		},
		// the idea was to force the user to select a language if none is selected
		// this however may not be possible if the site does not actually support multiple languages (the language service is always injected if you have CMS)
		triggerConfiguration: function() {
			// if you trigger the $configure event, it is usually for page parameter editing
			// if you don't have a selected language, the result will be stored in the JSON itself
			// this is OK (and intended) for development to have default content but not OK in for example qlty where:
			// a) you might be in a cluster (and only save the json on one server) 
			// b) changes are overwritten on the next deployment
			// so if there is no language service alltogether, we have no option but to store it in the json
			// otherwise you can only "not" have a language if you are in development mode
			if (this.isDevelopment() || !this.$services.language || this.$services.language.current) {
				this.emit("$configure", {});
			}
			else {
				this.$confirm({
					message: "You must select a language"
				});
			}
		},
		set: function(name, value) {
			var target = null;
			var parts = null;
			var updateUrl = false;
			// update something in the page parameters
			if (name.indexOf && name.indexOf("page.") == 0) {
				if (!this.masked) {
					updateUrl = true;
				}
				var pageParameter = this.page.content.parameters ? this.page.content.parameters.filter(function(parameter) {
					return parameter.name == name.substring("page.".length);
				})[0] : null;
				if (pageParameter) {
					target = this.variables;
					// also set it as the default value if in edit mode or light edit mode
					if (this.edit || (this.$services.page.canEdit() && this.$services.page.wantEdit)) {
						// if we have no language service, update the default value
						// alternatively if we have explicitly not selected a language and we are in development mode, we want to set the default as well
						// if however we are not in development mode, these are also sent to the backend and saved in the default language (that must be configured)
						if (!this.$services.language || (!this.hasLanguageSet() && ${environment("development")})) {
							pageParameter.default = value;
							// if we are in light edit mode, save the page automatically because there is no save button
							if (!this.edit && this.$services.page.canEdit() && this.$services.page.wantEdit) {
								this.savePage();
							}
						}
						// we have a language selected, save the value for that language
						else {
							this.saveTranslatedContent({
								page: pageParameter.global ? null : this.page.name,
								key: pageParameter.name,
								content: value
							});
						}
					}
				}
				else {
					target = this.parameters;
				}
				parts = name.substring("page.".length).split(".");
			}
			else if (name.split) {
				parts = name.split(".");
				target = this.variables;
			}
			// TODO: if single input, single output => can automatically bypass transformer?
			// or set a reverse transformer?
			// for now, transformers are only for going forward, not syncing data back, use events + reload if needed atm
			if (parts && target) {
				for (var i = 0; i < parts.length - 1; i++) {
					if (!target[parts[i]]) {
						Vue.set(target, parts[i], {});
					}
					target = target[parts[i]];
				}
				Vue.set(target, parts[parts.length - 1], value);
				if (updateUrl) {
					var route = this.$services.router.get(this.$services.page.alias(this.page));
					this.$services.router.router.updateUrl(
						route.alias,
						route.url,
						this.parameters,
						route.query)
				}
			}
			else {
				console.log("Could not set", name, value);
			}
		},
		pageContentTag: function() {
			if (!this.page.content.pageType || this.page.content.pageType == "page") {
				return null;
			}
			var self = this;
			var provider = nabu.page.providers("page-type").filter(function(x) {
				return x.name == self.page.content.pageType;
			})[0];
			return provider ? provider.pageContentTag : null;
		},
		pageTag: function() {
			// the default
			if (!this.page.content.pageType || this.page.content.pageType == "page") {
				return "div";
			}
			var self = this;
			var provider = nabu.page.providers("page-type").filter(function(x) {
				return x.name == self.page.content.pageType;
			})[0];
			// special override for editing purposes
			if (this.edit && provider && provider.pageTagEdit) {
				return provider.pageTagEdit;
			}
			return provider && provider.pageTag ? provider.pageTag : "div";
		},
		getPageTypes: function(value) {
			var items = ['page'];
			nabu.utils.arrays.merge(items, nabu.page.providers("page-type").map(function(x) { return x.name }));
			if (value) {
				items = items.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			return items;
		}
	},
	watch: {
		parameters: function(newValue) {
			var oldValue = JSON.parse(this.lastParameters);
			var changedValues = [];
			// find all the fields that have changed
			Object.keys(newValue).map(function(name) {
				if (oldValue[name] != newValue[name]) {
					changedValues.push("page." + name);
				}
			});
			this.lastParameters = JSON.stringify(newValue);
			//this.rerender(changedValues);
		},
		'page.content.globalEvents': {
			deep: true,
			handler: function(newValue) {
				var self = this;
				if (newValue) {
					newValue.forEach(function(globalEvent) {
						globalEvent.properties = self.getEvents()[globalEvent.localName];
					});
				}
			}
		}
	}
});

nabu.page.views.PageRows = Vue.component("n-page-rows", {
	template: "#page-rows",
	props: {
		page: {
			type: Object,
			required: true
		},
		rows: {
			type: Array,
			required: true
		},
		edit: {
			type: Boolean,
			required: false
		},
		parameters: {
			type: Object,
			required: false
		},
		events: {
			type: Object,
			required: true
		},
		// pass in state that is built up in rows/cells above (e.g. repeats)
		localState: {
			type: Object,
			required: false
		},
		root: {
			type: Boolean,
			required: false,
			default: false
		},
		stopRerender: {
			type: Boolean,
			required: false,
			default: false
		},
		depth: {
			type: Number,
			default: 0
		}
	},
	data: function() {
		return {
			configuring: null
		}
	},
	created: function() {
		var self = this;
		this.$on("close", function() {
			self.$parent.$emit("close");
		});
	},
	methods: {
		getRendererProperties: function(container) {
			return container.rendererProperties != null ? container.rendererProperties : {};	
		},
		getRendererPropertyKeys: function(container) {
			if (!container.renderer) {
				return {};
			}
			if (!container.rendererProperties) {
				Vue.set(container, "rendererProperties", {});
			}
			var renderer = nabu.page.providers("page-renderer").filter(function(x) { return x.name == container.renderer })[0];
			if (renderer == null) {
				return {};
			}
			return renderer.properties ? renderer.properties : [];
		},
		// type is cell or row (currently)
		getRenderers: function(type) {
			return nabu.page.providers("page-renderer").filter(function(x) { return x.type == null || x.type == type });
		},
		rowsTag: function() {
			if (this.depth > 0 || !this.page.content.pageType || this.page.content.pageType == "page") {
				return "div";	
			}
			var self = this;
			var provider = nabu.page.providers("page-type").filter(function(x) {
				return x.name == self.page.content.pageType;
			})[0];
			// special override for editing purposes
			if (this.edit && provider && provider.pageContentTagEdit) {
				return provider.pageContentTagEdit;
			}
			return provider && provider.pageContentTag ? provider.pageContentTag : "div";
		},
		rowTagFor: function(row) {
			var renderer = row.renderer == null ? null : nabu.page.providers("page-renderer").filter(function(x) { return x.name == row.renderer })[0];
			if (this.edit || renderer == null) {
				if (!this.page.content.pageType || this.page.content.pageType == "page") {
					return "div";	
				}
				var self = this;
				var provider = nabu.page.providers("page-type").filter(function(x) {
					return x.name == self.page.content.pageType;
				})[0];
				// if it is a function, we can do more stuff
				if (provider && provider.rowTag instanceof Function) {
					return provider.rowTag(row, this.depth, this.edit);
				}
				// special override for editing purposes
				else if (this.edit && provider && provider.rowTagEdit) {
					return provider.rowTagEdit;
				}
				return provider && provider.rowTag ? provider.rowTag : "div";
			}
			else {
				return renderer.component;
			}
		},
		cellTagFor: function(row, cell) {
			var renderer = cell.renderer == null ? null : nabu.page.providers("page-renderer").filter(function(x) { return x.name == cell.renderer })[0];
			if (this.edit || renderer == null) {
				if (!this.page.content.pageType || this.page.content.pageType == "page") {
					return "div";	
				}
				var self = this;
				var provider = nabu.page.providers("page-type").filter(function(x) {
					return x.name == self.page.content.pageType;
				})[0];
				// if it is a function, we can do more stuff
				if (provider && provider.cellTag instanceof Function) {
					return provider.cellTag(row, cell, this.depth, this.edit);
				}
				// special override for editing purposes
				else if (this.edit && provider && provider.cellTagEdit) {
					return provider.cellTagEdit;
				}
				return provider && provider.cellTag ? provider.cellTag : "div";
			}
			else {
				return renderer.component;
			}
		},
		getInstance: function() {
			return this.$services.page.instances[this.name];	
		},
		getState: function(row, cell) {
			var self = this;
			var localState = this.getLocalState(row, cell);
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			Object.keys(pageInstance.variables).map(function(key) {
				if (typeof(localState[key]) == "undefined") {
					localState[key] = pageInstance.variables[key];
				}
			});
			var page = this.$services.page.getPageParameterValues(this.page, pageInstance);
			if (Object.keys(page).length) {
				localState.page = page;
			}
			return localState;
		},
		getLocalState: function(row, cell) {
			var state = {};
			// inherit state from above
			if (this.localState) {
				Object.keys(this.localState).map(function(key) {
					state[key] = this.localState[key];
				})
			}
			// add local state of row
			if (row && row.data) {
				Object.keys(row.data).map(function(key) {
					state[key] = row.data[key];
				})
			}
			// add local state of cell
			if (cell && cell.data) {
				Object.keys(cell.data).map(function(key) {
					state[key] = cell.data[key];
				})
			}
			return state;
		},
		// can't be a computed cause we depend on the $parent to resolve some variables
		// and that's not reactive...
		getCalculatedRows: function() {
			// if we are in edit mode, we don't actually calculate rows
			if (this.edit) {
				return this.rows;
			}
			else {
				return this.mapCalculated(this.rows);
			}
		},
		mapCalculated: function(list) {
			var self = this;
			var result = [];
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			if (!pageInstance) {
				return result;
			}
			list.map(function(entry) {
				// no local state, just push it
				if (!entry.instances || !Object.keys(entry.instances).length) {
					result.push(entry);
				}
				else {
					var key = Object.keys(entry.instances)[0];
					// it is possible that you have not yet filled in a field here
					if (entry.instances[key]) {
						var parts = entry.instances[key].split(".");
						var parent = self.$parent;
						var value = null;
						var found = false;
						while (parent) {
							if (parent.data && parent.data[parts[0]]) {
								found = true;
								value = parent.data;
								parts.map(function(single) {
									if (value) {
										value = value[single];
									}
								});
								break;
							}
							parent = parent.$parent;
						}
						if (!found) {
							value = pageInstance.get(entry.instances[key]);
						}
						if (value instanceof Array) {
							var counter = 0;
							value.map(function(single) {
								var newEntry = {};
								Object.keys(entry).map(function(key) {
									newEntry[key] = entry[key];
								});
								newEntry.data = {};
								newEntry.data[key] = single;
								newEntry.id += "-" + counter++;
								result.push(newEntry);
							})
						}
					}
				}
			});
			return result;
		},
		getCalculatedCells: function(row) {
			if (this.edit) {
				return row.cells;
			}
			else {
				return this.mapCalculated(row.cells);
			}
		},
		getSideBarStyles: function(cell) {
			var styles = [];
			if (cell.width != null) {
				if (typeof(cell.width) == "number" || (cell.width.match && cell.width.match(/^[0-9.]+$/))) {
					styles.push({'flex-grow': cell.width});
				}
				else {
					styles.push({'min-width': cell.width});
				}
			}
			return styles;
		},
		getStyles: function(cell) {
			var width = typeof(cell.width) == "undefined" ? 1 : cell.width;
			var styles = [];
			if (width != null) {
				if (typeof(width) == "number" || (width.match && width.match(/^[0-9.]+$/))) {
					styles.push({'flex-grow': width});
				}
				else {
					styles.push({'min-width': width});
				}
			}
			if (cell.height) {
				styles.push({'height': cell.height});
			}
			if ((this.edit || this.$services.page.wantEdit) && cell.name) {
				styles.push({"border": "solid 2px " + this.getNameColor(cell.name), "border-style": "none solid solid solid"})
			}
			return styles;
		},
		hasPageRoute: function(cell) {
			if (cell.alias) {
				var route = this.$services.router.get(cell.alias);
				if (route && route.isPage) {
					return true;
				}
			}
			return false;
		},
		up: function(row) {
			var index = this.rows.indexOf(row);
			if (index > 0) {
				var replacement = this.rows[index - 1];
				this.rows.splice(index - 1, 1, row);
				this.rows.splice(index, 1, replacement);
			}
		},
		down: function(row) {
			var index = this.rows.indexOf(row);
			if (index < this.rows.length - 1) {
				var replacement = this.rows[index + 1];
				this.rows.splice(index + 1, 1, row);
				this.rows.splice(index, 1, replacement);
			}
		},
		cellDown: function(row, cell) {
			var index = this.rows.indexOf(row);
			if (index < this.rows.length - 1) {
				var target = this.rows[index + 1];
				row.cells.splice(row.cells.indexOf(cell));
				target.cells.push(cell);
			}
		},
		cellUp: function(row, cell) {
			var index = this.rows.indexOf(row);
			if (index > 0) {
				var target = this.rows[index - 1];
				row.cells.splice(row.cells.indexOf(cell));
				target.cells.push(cell);
			}
		},
		left: function(row, cell) {
			var index = row.cells.indexOf(cell);
			if (index > 0) {
				var replacement = row.cells[index - 1];
				row.cells.splice(index - 1, 1, cell);
				row.cells.splice(index, 1, replacement);
			}
		},
		right: function(row, cell) {
			var index = row.cells.indexOf(cell);
			if (index < row.cells.length - 1) {
				var replacement = row.cells[index + 1];
				row.cells.splice(index + 1, 1, cell);
				row.cells.splice(index, 1, replacement);
			}
		},
		filterRoutes: function(value) {
			var routes = this.$services.router.list().filter(function(x) {
				return x.alias && (!value || x.alias.toLowerCase().indexOf(value.toLowerCase()) >= 0);
			});
			routes.sort(function(a, b) {
				return a.alias.localeCompare(b.alias);
			});
			return routes.map(function(x) { return x.alias });
		},
		getRouteParameters: function(cell) {
			var route = this.$services.router.get(cell.alias);
			return route ? this.$services.page.getRouteParameters(route) : {};
		},
		getAvailableParameters: function(cell) {
			return this.$services.page.getAvailableParameters(this.page, cell, true);
		},
		getAvailableEvents: function(event) {
			var available = this.$services.page.getPageInstance(this.page, this).getEvents();
			var result = Object.keys(available);
			if (event) {
				result = result.filter(function(x) {
					return x.toLowerCase().indexOf(event.toLowerCase()) >= 0;
				});
			}
			result.sort();
			return result;
		},
		canConfigure: function(cell) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			var components = pageInstance.components;
			return components[cell.id] && components[cell.id].configure;
		},
		configure: function(cell) {
			if (this.canConfigure) {
				var self = this;
				var pageInstance = self.$services.page.getPageInstance(self.page, self);
				var cellInstance = pageInstance.components[cell.id];
				cellInstance.configure();
			}
		},
		close: function(cell) {
			var self = this;
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			if (cell.on || cell.closeable) {
				Vue.set(pageInstance.closed, cell.id, cell.on ? cell.on : "$any");
			}
			else {
				this.$parent.$emit("close");
			}
		},
		shouldRenderRow: function(row) {
			if (this.edit) {
				return true;
			}
			// if we have width limitations, check those first
			if (row.devices) {
				if (!this.isDevice(row.devices)) {
					return false;
				}
			}
			if (!!row.condition) {
				if (!this.$services.page.isCondition(row.condition, this.getState(row), this)) {
					return false;
				}
			}
			var self = this;
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			if (row.on) {
				if (!pageInstance.get(row.on)) {
					return false;
				}
			}
			return true;
		},
		isDevice: function(devices) {
			var actual = this.$services.resizer.width;
			for (var i = 0; i < devices.length; i++) {
				if (devices[i].operator && devices[i].name) {
					var operator = devices[i].operator;
					var width = 0;
					if (devices[i].name.match(/[0-9]+/)) {
						width = parseInt(devices[i].name);
					}
					else {
						var device = this.$services.page.devices.filter(function(x) { return x.name == devices[i].name })[0];
						if (device && device.width) {
							width = parseInt(device.width);
						}
					}
					// infinitely big, so matches any query requesting larger
					if (width == 0) {
						if (operator != ">" && operator != ">=") {
							return false;
						}
					}
					else if (operator == "<" && actual >= width) {
						return false;
					}
					else if (operator == "<=" && actual > width) {
						return false;
					}
					else if (operator == ">" && actual <= width) {
						return false;
					}
					else if (operator == ">=" && actual < width) {
						return false;
					}
					else if (operator == "==" && actual != width) {
						return false;
					}
				}
			}
			return true;
		},
		cellId: function(cell) {
			var cellId = 'page_' + this.pageInstanceId + '_cell_' + cell.id;
			if (cell.on && cell.optimizeVueKey) {
				var self = this;
				var pageInstance = self.$services.page.getPageInstance(self.page, self);
				var on = pageInstance.get(cell.on);
				if (on) {
					cellId += JSON.stringify(on);
				}
			}
			return cellId;
		},
		shouldRenderCell: function(row, cell) {
			if (this.edit) {
				if (row.collapsed) {
					return false;
				}
				return true;
			}
			else if (!cell.alias && !cell.rows.length && !cell.customId) {
				return false;
			}
			// if we have width limitations, check those first
			if (cell.devices) {
				if (!this.isDevice(cell.devices)) {
					return false;
				}
			}
			
			if (cell.condition) {
				if (!this.$services.page.isCondition(cell.condition, this.getState(row, cell), this)) {
					return false;
				}
			}
			var self = this;
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			// if we depend on an event and it hasn't happened yet, don't render
			// not sure if it will rerender if we close it?
			if (cell.on) {
				// if we explicitly closed it, leave it closed until it is reset
				if (pageInstance.closed[cell.id]) {
					return false;
				}
				else if (!pageInstance.get(cell.on)) {
					return false;
				}
			}
			else if (cell.closeable && pageInstance.closed[cell.id]) {
				return false;
			}
			var providers = [];
			nabu.page.providers("page-enumerate").map(function(x) {
				providers.push(x.name);
			});
			var consensus =  Object.keys(cell.bindings).reduce(function(consensus, name) {
				// fixed values are always ok
				if (cell.bindings[name] && cell.bindings[name].indexOf && cell.bindings[name].indexOf("fixed") == 0) {
					return consensus;
				}
				else if (cell.bindings[name] && cell.bindings[name].label && cell.bindings[name].label == "fixed") {
					return consensus;
				}
				// always allow enumerated values
				else if (cell.bindings[name] && cell.bindings[name].split && providers.indexOf(cell.bindings[name].split(".")[0]) >= 0) {
					return consensus;
				}
				// if we have a bound value and it does not originate from the (ever present) page, it must come from an event
				// check that the event has occurred
				// use the cell.on to define this?
				// sometimes need to always show an empty table or whatever
				// may need to allow an array in cell.on?
				/*if (cell.bindings[name] && cell.bindings[name].indexOf("page.") != 0) {
					var parts = cell.bindings[name].split(".");
					// if the event does not exist yet, stop
					if (!pageInstance.variables[parts[0]]) {
						return false;
					}
				}*/
				return consensus;
			}, true);
			return consensus;
		},
		// changedValues is an array of field names that have changed, e.g. "page.test" or "select.$all" etc
		shouldRerenderCell: function(cell, changedValues) {
			if (!changedValues || !changedValues.length) {
				return false;
			}
			return Object.keys(cell.bindings).reduce(function(consensus, name) {
				return consensus || changedValues.indexOf(cell.bindings[name]) >= 0;
			}, false);
		},
		mounted: function(cell, row, state, component) {
			var self = this;
			self.$services.page.getPageInstance(self.page, self).mounted(cell, row, state, component);
			component.$on("close", function() {
				self.close(cell);
			});
		},
		getMountedFor: function(cell, row) {
			return this.mounted.bind(this, cell, row, this.getLocalState(row, cell));
		},
	/*	renderAll: function(changedValues) {
			var self = this;
			var mount = function(cell) {
				self.$services.router.route(cell.alias, self.getParameters(cell), self.page.name + "_" + cell.id, true).then(function(component) {
					self.$services.page.instances[self.page.name].mounted(cell, component);
				})
			}
			for (var i = 0; i < this.rows.length; i++) {
				if (this.rows[i].cells) {
					for (var j = 0; j < this.rows[i].cells.length; j++) {
						var cell = this.rows[i].cells[j];
						if (this.shouldRenderCell(cell)) {
							// if it is not the first render, check that we need to rerender it
							if (!self.$services.page.instances[self.page.name].components[cell.id] || this.shouldRerenderCell(cell, changedValues)) {
								mount(cell);
							}
						}
						// if we past in changed values, we are doing a rerender it, trigger all child rows as well
						if (changedValues && changedValues.length) {
							this.$refs[this.page.name + '_' + cell.id + '_rows'].renderAll(changedValues);
						}
					}
				}
			}
		},
		render: function(id) {
			// TODO
		},*/
		getCell: function(id) {
			for (var i = 0; i < this.rows.length; i++) {
				if (this.rows[i].cells) {
					for (var j = 0; j < this.rows[i].cells.length; j++) {
						if (this.rows[i].cells[j].id == id) {
							return this.rows[i].cells[j];
						}
					}
				}
			}
			return null;
		},
		getRowEditStyle: function(row) {
			return 'background-color:' + this.getNameColor(row.name) + '; color: #fff';	
		},
		getCellEditStyle: function(cell) {
			return 'background-color:' + this.getNameColor(cell.name) + '; color: #fff';	
		},
		getNameColor: function(name) {
			var saturation = 80;
			var lightness = 40;
			var hash = 0;
			for (var i = 0; i < name.length; i++) {
				hash = name.charCodeAt(i) + ((hash << 5) - hash);
			}
			var hue = hash % 360;
			return 'hsl('+ hue +', '+ saturation +'%, '+ lightness +'%)';
		},
		getParameters: function(row, cell) {
			var self = this;
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			var result = {
				page: this.page,
				parameters: this.parameters,
				cell: cell,
				edit: this.edit,
				//state: pageInstance.variables,
				// if we are in edit mode, the local state does not matter
				// and if we add it, we retrigger a redraw everytime we change something
				localState: this.edit ? null : this.getLocalState(row, cell),
				pageInstanceId: this.pageInstanceId,
				stopRerender: this.edit
			};
			// if we have a trigger event, add it explicitly to trigger a redraw if needed
			if (cell.on) {
				result[cell.on] = pageInstance.variables[cell.on];
			}
			Object.keys(cell.bindings).map(function(key) {
				if (cell.bindings[key]) {
					var value = self.$services.page.getBindingValue(pageInstance, cell.bindings[key]);
					// only set the value if it actually has some value
					// otherwise we might accidently trigger a redraw with no actual new value
					// if we remove a value that was there before, it will still redraw as the parameters will have fewer keys
					// and adding something "should" trigger redraw anyway
					if (typeof(value) != "undefined" && value != null) {
						result[key] = value;
					}
				}
			});
			return result;
		},
		addDevice: function(cell) {
			if (!cell.devices) {
				Vue.set(cell, "devices", []);
			}
			cell.devices.push({name: null, operator: '>'});
		},
		suggestDevices: function(value) {
			var devices = this.$services.page.devices.map(function(x) { return x.name }); 
			if (value && value.match(/[0-9]+/)) { 
				devices.unshift(value) 
			}
			return devices;
		},
		resetEvents: function() {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			pageInstance.resetEvents();	
		},
		clickOnCell: function(cell) {
			if (cell.clickEvent && !this.edit) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				pageInstance.emit(cell.clickEvent, {});
			}	
		},
		addCell: function(target) {
			if (!target.cells) {
				Vue.set(target, "cells", []);
			}
			target.cells.push({
				id: this.page.content.counter++,
				rows: [],
				// the alias of the route we want to render here (if any)
				alias: null,
				// the route may have input parameters (path + query), these are the relevant bindings
				// the binding variable contains keys for each path/query parameter in the route
				bindings: {},
				name: null,
				// state that is maintained by the cell owner (the route alias)
				// for example it might offer additional configuration
				state: {},
				// the rendering target (e.g. sidebar, prompt,...)
				target: 'page',
				// it can depend on an event of taking place
				on: null,
				// a class for this cell
				class: null,
				// a custom id for this cell
				customId: null,
				// flex width
				width: 1,
				height: null,
				instances: {},
				condition: null,
				devices: [],
				clickEvent: null
			});
		},
		addInstance: function(target) {
			if (!target.instances) {
				Vue.set(target, "instances", {});
			}
			Vue.set(target.instances, "unnamed", null);
		},
		removeInstance: function(target, name) {
			// currently just reset the instances thing, we currently only allow one
			Vue.set(target, "instances", {});	
		},
		renameInstance: function(target, oldName, newName) {
			Vue.set(target.instances, newName, target.instances[oldName]);
			Vue.delete(target.instances, oldName);
		},
		addRow: function(target) {
			if (!target.rows) {
				Vue.set(target, "rows", []);
			}
			target.rows.push({
				id: this.page.content.counter++,
				cells: [],
				class: null,
				// a custom id for this row
				customId: null,
				// you can map an instance of an array to a row
				// for instance if you have an array of "contracts", you could map it to the variable "contract"
				// the key is the local name, the value is the name of the object in the page
				instances: {},
				condition: null,
				direction: null,
				align: null,
				on: null,
				collapsed: false,
				name: null
			});
		},
		removeCell: function(cells, cell) {
			this.$confirm({
				message: "Are you sure you want to remove this cell?"
			}).then(function() {
				cells.splice(cells.indexOf(cell), 1);
			});
		},
		removeRow: function(cell, row) { 
			cell.rows.splice(cell.rows(indexOf(row), 1));
		},
		setContent: function(cell) {
			var self = this;
			this.$prompt(function() {
				return new nabu.page.views.PageAddCell({propsData: {
					page: self.page
				}});
			}).then(function(content) {
				nabu.utils.objects.merge(cell, content);
			});
		},
		rowStyles: function(row) {
			var styles = [];
			if (row.direction == "horizontal") {
				styles.push({"flex-direction": "row"})
			}
			else if (row.direction == "vertical") {
				styles.push({"flex-direction": "column"})
			}
			if (!!row.align) {
				styles.push({"align-items": row.align});
			}
			if (!!row.justify) {
				styles.push({"justify-content": row.justify});
			}
			if ((this.edit || this.$services.page.wantEdit) && row.name) {
				styles.push({"border": "solid 2px " + this.getNameColor(row.name), "border-style": "none solid solid solid"})
			}
			return styles;
		},
		rowButtonStyle: function(row) {
			var styles = [];
			if (row.direction == "vertical") {
				styles.push({"display": "inline-block"})
			}
			return styles;
		},
		copyCell: function(cell) {
			nabu.utils.objects.copy({
				type: "page-cell",
				content: cell
			});
		},
		copyRow: function(row) {
			nabu.utils.objects.copy({
				type: "page-row",
				content: row
			});
		},
		pasteCell: function(row) {
			row.cells.push(this.$services.page.renumber(this.page, this.$services.page.copiedCell));
			this.$services.page.copiedCell = null;
		},
		pasteRow: function(cell) {
			cell.rows.push(this.$services.page.renumber(this.page, this.$services.page.copiedRow));
			this.$services.page.copiedRow = null;
		},
		mouseOut: function(event, row, cell) {
			var self = this;
			if (self.edit) {
				var rowTarget = document.getElementById(self.page.name + '_' + row.id);
				if (rowTarget) {
					rowTarget.classList.remove("hovering");
				}
				if (cell) {
					var cellTarget = document.getElementById(self.page.name + '_' + row.id + '_' + cell.id);
					if (cellTarget) {
						cellTarget.classList.remove("hovering");
					}
				}
			}
		},
		mouseOver: function(event, row, cell) {
			if (this.edit) {
				var rowTarget = document.getElementById(this.page.name + '_' + row.id);
				if (rowTarget) {
					rowTarget.classList.add("hovering");
				}
				if (cell) {
					var cellTarget = document.getElementById(this.page.name + '_' + row.id + '_' + cell.id);
					if (cellTarget) {
						cellTarget.classList.add("hovering");
					}
					if (!event.shiftKey) {
						event.stopPropagation();
					}
				}
			}
		},
		menuHover: function($event) {
			if (this.edit) {
				var self = this;
				if ($event.target.$unhover) {
					clearTimeout($event.target.$unhover);
					$event.target.$unhover = null;
				}
				$event.target.classList.add("menu-hovering");
			}
		},
		menuUnhover: function($event) {
			if (this.edit) {
				var self = this;
				$event.target.$unhover = setTimeout(function() {
					$event.target.classList.remove("menu-hovering");
					$event.target.$unhover = null;
				}, 500);
			}
		}
	}
});

Vue.component("n-prompt", {
	template: "#n-prompt"
});
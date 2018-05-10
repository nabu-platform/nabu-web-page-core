if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

// on created, we want to inject the state of the page into this component so we can access all the data
Vue.mixin({
	props: {
		localState: {
			type: Object,
			required: false
		}
	},
	data: function() {
		return {
			state: {}
		}
	},
	created: function() {
		var self = this;
		// map any local state
		if (this.localState) {
			Object.keys(this.localState).map(function(key) {
				Vue.set(self.state, key, self.localState[key]);
			});
		}
		if (this.page) {
			var pageInstance = this.$services.page.instances[this.page.name];
			// when creating the actual page, we do not have an instance yet!
			// nor is it important...
			if (pageInstance) {
				Object.keys(pageInstance.variables).map(function(key) {
					if (typeof(self.state[key]) == "undefined") {
						Vue.set(self.state, key, pageInstance.variables[key]);
					}
				})
			}
		}
	}
})

// methods in cell instances:
// - configure: start configuration for the cell content
// - getEvents: return event definitions
// - getLocalState: return the state definition for this level (e.g. because of for loop or variable scoping)
nabu.page.views.Page = Vue.extend({
	template: "#page",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		}
	},
	activate: function(done) {
		if (this.page.content.states.length) {
			var self = this;
			var promises = this.page.content.states.map(function(state) {
				var parameters = {};
				Object.keys(state.bindings).map(function(key) {
					parameters[key] = self.get(state.bindings[key]);
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
			this.$services.q.all(promises).then(done, done);
		}
		else {
			done();
		}
	},
	created: function() {
		this.$services.page.instances[this.page.name] = this;
		// keep a stringified copy of the last parameters so we can diff
		this.lastParameters = JSON.stringify(this.parameters);
		if (this.page.content.parameters) {
			var self = this;
			this.page.content.parameters.map(function(x) {
				if (!!x.default && !!x.name) {
					Vue.set(self.variables, x.name, x.default);
				}
			});
		}
	},
	computed: {
		events: function() {
			return this.getEvents();
		},
		availableParameters: function() {
			// there are all the events
			var available = nabu.utils.objects.clone(this.getEvents());
			// and the page
			available.page = this.$services.page.getPageParameters(this.page);
			return available;
		},
		classes: function() {
			var classes = [];
			if (this.edit) {
				classes.push("edit");
			}
			if (this.page.content.class) {
				classes.push(this.page.content.class);
			}
			return classes;
		}
	},
	data: function() {
		return {
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
			// subscriptions to events
			subscriptions: {}
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
			console.log("over", event);
		},
		dropMenu: function(event) {
			event.preventDefault();
			event.stopPropagation();
			var rect = this.$el.getBoundingClientRect();
			Vue.set(this.page.content, "menuX", event.clientX - rect.left);
			Vue.set(this.page.content, "menuY", event.clientY - rect.top);
			this.$services.page.update(this.page);
		},
		getOperationParameters: function(operation) {
			var parameters = this.$services.swagger.operations[operation].parameters;
			return parameters ? parameters.map(function(x) { return x.name }) : [];
		},
		getOperations: function() {
			return Object.keys(this.$services.swagger.operations);
		},
		getAvailableEvents: function() {
			var available = this.getEvents();
			return Object.keys(available);
		},
		addAction: function() {
			this.page.content.actions.push({
				name: null,
				on: null,
				confirmation: null,
				operation: null,
				route: null,
				anchor: null,
				bindings: {}
			});
		},
		removeQuery: function(index) {
			this.page.content.query.splice(index, 1);	
		},
		mounted: function(cell, row, state, component) {
			// reset event cache
			this.cachedEvents = null;
			this.components[cell.id] = component;
			
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
				})
			}
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
				// we can listen to events and take a value from them to update the current value
				// e.g. we could update a search parameter if you select something
				listeners: []
			});
		},
		removeRow: function(row) { 
			this.page.content.rows.splice(this.page.content.rows(indexOf(row), 1))
		},
		getEvents: function() {
			// non-watched cache property
			// we have too many problems with update loops that are triggered by this method
			// and in general the result should only change if we route new content
			if (!this.cachedEvents) {
				var events = {};
				var self = this;
				Object.keys(this.components).map(function(cellId) {
					if (self.components[cellId].getEvents) {
						var cellEvents = self.components[cellId].getEvents();
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
				this.cachedEvents = events;
			}
			return this.cachedEvents;
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
						console.log("interested in", parts[0], name);
						if (parts[0] == name) {
							var interested = value;
							for (var i = 1; i < parts.length; i++) {
								if (interested) {
									interested = interested[parts[i]];
								}
							}
							console.log("updating", parameter.name, interested);
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
			
			var promise = this.$services.q.defer();
			promises.push(promise);
			// check all the actions to see if we need to run something
			this.page.content.actions.map(function(action) {
				if (action.on == name) {
					var parameters = {};
					Object.keys(action.bindings).map(function(key) {
						parameters[key] = self.get(action.bindings[key]);	
					});
					if (action.confirmation) {
						self.$confirm({message:action.confirmation}).then(function() {
							if (action.route) {
								self.$services.router.route(action.route, parameters, action.anchor ? action.anchor : null, action.anchor ? true : false);
							}
							else {
								self.$services.swagger.execute(action.operation, parameters).then(promise, promise);
							}
						}, function() {
							promise.reject();
						})
					}
					else {
						if (action.route) {
							self.$services.router.route(action.route, parameters, action.anchor ? action.anchor : null, action.anchor ? true : false);
						}
						else {
							self.$services.swagger.execute(action.operation, parameters).then(promise, promise);
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
			
			// remove all the closed stuff for this event, we may want to reopen something
			Object.keys(this.closed).map(function(key) {
				if (self.closed[key] == name) {
					Vue.set(self.closed, key, null);
				}
			});
			return this.$services.q.all(promises);
		},
		get: function(name) {
			// probably not filled in the value yet
			if (!name) {
				return null;
			}
			if (name == "page") {
				return this.parameters;
			}
			else if (name.indexOf("page.") == 0) {
				var name = name.substring("page.".length);
				var applicationProperty = this.$services.page.properties.filter(function(property) {
					return property.key == name;
				})[0];
				var pageParameter = this.page.content.parameters ? this.page.content.parameters.filter(function(parameter) {
					return parameter.name == name;
				})[0] : null;
				if (applicationProperty) {
					return applicationProperty.value;
				}
				else if (pageParameter) {
					return this.variables[pageParameter.name];
				}
				else {
					return this.parameters[name];
				}
			}
			// we want an entire event
			else if (name.indexOf(".") < 0) {
				return this.variables[name];
			}
			// we still want an entire event
			else if (name.indexOf(".$all") >= 0) {
				return this.variables[name.substring(0, name.indexOf(".$all"))];
			}
			else {
				var parts = name.split(".");
				return this.variables[parts[0]] ? this.variables[parts[0]][parts[1]] : null;
			}
		},
		set: function(name, value) {
			var target = null;
			var parts = null;
			// update something in the page parameters
			if (name.indexOf("page.") == 0) {
				target = this.parameters;
				parts = name.substring("page.".length).split(".");
				// TODO: update the URL? what if it is masked?
			}
			else {
				parts = name.split(".");
				target = this.variables;
			}
			for (var i = 0; i < parts.length - 1; i++) {
				if (!target[parts[i]]) {
					target[parts[i]] = {};
				}
				target = target[parts[i]];
			}
			target[parts[parts.length - 1]] = value;
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
			this.rerender(changedValues);
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
		}
	},
	data: function() {
		return {
			configuring: null
		}
	},
	methods: {
		getState: function(row, cell) {
			var self = this;
			var localState = this.getLocalState(row, cell);
			var pageInstance = self.$services.page.instances[self.page.name];
			Object.keys(pageInstance.variables).map(function(key) {
				if (typeof(localState[key]) == "undefined") {
					localState[key] = pageInstance.variables[key];
				}
			});
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
			var pageInstance = self.$services.page.instances[self.page.name];
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
		getStyles: function(cell) {
			var width = typeof(cell.width) == "undefined" ? 1 : cell.width;
			var styles = [{'flex-grow': width}];
			if (cell.height) {
				styles.push({'height': cell.height});
			}
			return styles;
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
			return this.$services.page.getRouteParameters(route);
		},
		getAvailableParameters: function(cell) {
			return this.$services.page.getAvailableParameters(this.page, cell);
		},
		getAvailableEvents: function() {
			var available = nabu.utils.objects.clone(this.$services.page.instances[this.page.name].getEvents());
			return Object.keys(available);
		},
		canConfigure: function(cell) {
			var pageInstance = this.$services.page.instances[this.page.name];
			var components = pageInstance.components;
			return components[cell.id] && components[cell.id].configure;
		},
		configure: function(cell) {
			if (this.canConfigure) {
				var pageInstance = this.$services.page.instances[this.page.name];
				var cellInstance = pageInstance.components[cell.id];
				cellInstance.configure();
			}
		},
		close: function(cell) {
			var pageInstance = this.$services.page.instances[this.page.name];
			Vue.set(pageInstance.closed, cell.id, cell.on);
		},
		shouldRenderRow: function(row) {
			if (this.edit) {
				return true;
			}
			if (!!row.condition) {
				if (!this.$services.page.isCondition(row.condition, getState(row))) {
					return false;
				}
			}
			var pageInstance = this.$services.page.instances[this.page.name];
			if (row.on) {
				if (!pageInstance.get(row.on)) {
					return false;
				}
			}
			return true;
		},
		shouldRenderCell: function(row, cell) {
			if (this.edit) {
				if (row.collapsed) {
					return false;
				}
				return true;
			}
			else if (!cell.alias) {
				return false;
			}
			if (cell.condition) {
				if (!this.$services.page.isCondition(cell.condition, this.getState(row, cell))) {
					return false;
				}
			}
			var self = this;
			var pageInstance = self.$services.page.instances[self.page.name];
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
			return Object.keys(cell.bindings).reduce(function(consensus, name) {
				// if we have a bound value and it does not originate from the (ever present) page, it must come from an event
				// check that the event has occurred
				if (cell.bindings[name] && cell.bindings[name].indexOf("page.") != 0) {
					var parts = cell.bindings[name].split(".");
					// if the event does not exist yet, stop
					if (!pageInstance.variables[parts[0]]) {
						return false;
					}
				}
				return consensus;
			}, true);
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
			this.$services.page.instances[this.page.name].mounted(cell, row, state, component);
			var self = this;
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
		getParameters: function(row, cell) {
			var pageInstance = this.$services.page.instances[this.page.name];
			var result = {
				page: this.page,
				parameters: this.parameters,
				cell: cell,
				edit: this.edit,
				//state: pageInstance.variables,
				// if we are in edit mode, the local state does not matter
				// and if we add it, we retrigger a redraw everytime we change something
				localState: this.edit ? null : this.getLocalState(row, cell)
			};
			// if we have a trigger event, add it explicitly to trigger a redraw if needed
			if (cell.on) {
				result[cell.on] = pageInstance.variables[cell.on];
			}
			Object.keys(cell.bindings).map(function(key) {
				if (cell.bindings[key]) {
					var value = pageInstance.get(cell.bindings[key]);
					// only set the value if it actually has some value
					// otherwise we might accidently trigger a redraw with no actual new value
					// if we remove a value that was there before, it will still redraw as the parameters will have fewer keys
					// and adding something "should" trigger redraw anyway
					if (typeof(value) != "undefined" && value != null) {
						result[key] = pageInstance.get(cell.bindings[key]);
					}
				}
			});
			return result;
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
				condition: null
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
			cells.splice(cells.indexOf(cell), 1);
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
			return styles;
		},
		rowButtonStyle: function(row) {
			var styles = [];
			if (row.direction == "vertical") {
				styles.push({"display": "inline-block"})
			}
			return styles;
		}
	}
});

Vue.component("n-prompt", {
	template: "#n-prompt"
});
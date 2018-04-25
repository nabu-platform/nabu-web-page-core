if (!nabu) { var nabu = {} }
if (!nabu.views) { nabu.views = {} }
if (!nabu.views.cms) { nabu.views.cms = {} }

nabu.views.cms.Page = Vue.extend({
	template: "#nabu-cms-page",
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
	created: function() {
		this.$services.page.instances[this.page.name] = this;
		// keep a stringified copy of the last parameters so we can diff
		this.lastParameters = JSON.stringify(this.parameters);
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
		dragMenu: function(event) {
			event.dataTransfer.setData("page-menu", this.page.name);	
		},
		dragOver: function(event) {
			console.log("over", event);
		},
		dropMenu: function(event) {
			event.preventDefault();
			event.stopPropagation();
			Vue.set(this.page.content, "menuX", event.clientX);
			Vue.set(this.page.content, "menuY", event.clientY);
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
				bindings: {}
			});
		},
		removeQuery: function(index) {
			this.page.content.query.splice(index, 1);	
		},
		canEdit: function() {
			return true;	
		},
		mounted: function(cell, component) {
			this.components[cell.id] = component;
			// make sure we have a watchable variable for each event
			if (component.events) {
				var self = this;
				Object.keys(component.events).map(function(name) {
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
				class: null
			});
		},
		removeRow: function(row) { 
			this.page.content.rows.splice(this.page.content.rows(indexOf(row), 1))
		},
		rerender: function(changedValues) {
			if (changedValues && changedValues.length) {
				this.$refs[this.page.name + '_rows'].renderAll(changedValues);
			}
		},
		getEvents: function() {
			var events = {};
			var self = this;
			Object.keys(this.components).map(function(cellId) {
				var cellEvents = self.components[cellId].events;
				if (cellEvents) {
					nabu.utils.objects.merge(events, cellEvents);
				}
			});
			Object.keys(events).map(function(name) {
				// its an array of names
				events[name].sort();
				// we add the pseudo variable "$all" which basically indicates you want the entire event rather than a specific sub-value of it
				if (events[name].indexOf("$all") < 0) {
					events[name].push("$all");
				}
			});
			return events;
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
		emit: function(name, value) {
			this.variables[name] = value;
			var self = this;
			
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
							self.$services.swagger.execute(action.operation, parameters).then(promise, promise);
						}, function() {
							promise.reject();
						})
					}
					else {
						self.$services.swagger.execute(action.operation, parameters).then(promise, promise);
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
			if (name == "page") {
				return this.parameters;
			}
			else if (name.indexOf("page.") == 0) {
				return this.parameters[name.substring("page.".length)];	
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

nabu.views.cms.PageRows = Vue.component("n-page-rows", {
	template: "#nabu-cms-page-rows",
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
		}
	},
	data: function() {
		return {
			configuring: null
		}
	},
	methods: {
		getStyles: function(cell) {
			var width = typeof(cell.width) == "undefined" ? 1 : cell.width;
			return [{'flex-grow': width}]
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
		getAvailableParameters: function(cell) {
			// there are all the events
			var available = nabu.utils.objects.clone(this.$services.page.instances[this.page.name].getEvents());
			var result = {};
			if (cell.on) {
				result[cell.on] = available[cell.on];
			}
			// and the page
			result.page = this.$services.page.getPageParameters(this.page);
			return result;
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
		shouldRenderCell: function(cell) {
			if (!cell.alias) {
				return false;
			}
			else if (this.edit) {
				return true;
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
		mounted: function(cell, component) {
			this.$services.page.instances[this.page.name].mounted(cell, component);
			var self = this;
			component.$on("close", function() {
				self.close(cell);
			});
		},
		getMountedFor: function(cell) {
			return this.mounted.bind(this, cell);	
		},
		renderAll: function(changedValues) {
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
		},
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
		getParameters: function(cell) {
			var result = {
				page: this.page,
				parameters: this.parameters,
				cell: cell,
				edit: this.edit
			};
			var pageInstance = this.$services.page.instances[this.page.name];
			Object.keys(cell.bindings).map(function(key) {
				if (cell.bindings[key]) {
					result[key] = pageInstance.get(cell.bindings[key]);
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
				width: 1
			});
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
				customId: null
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
				return new nabu.views.cms.PageAddCell({propsData: {
					page: self.page
				}});
			}).then(function(content) {
				nabu.utils.objects.merge(cell, content);
			});
		}
	}
});

Vue.component("n-prompt", {
	template: "#n-prompt"
});
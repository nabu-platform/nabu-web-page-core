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
			configuring: false
		}
	},
	methods: {
		removeQuery: function(index) {
			this.page.content.query.splice(index, 1);	
		},
		canEdit: function() {
			return true;	
		},
		mounted: function(cell, component) {
			this.components[cell.id] = component;
		},
		addRow: function() {
			this.page.content.rows.push({
				id: this.page.content.counter++,
				cells: []
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
		emit: function(name, value) {
			this.variables[name] = value;
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
				return this.variables[parts[0]][parts[1]];
			}
		}
	},
	event: {
		instance: function(name, value) {
			this.variables[name] = value;
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
	ready: function() {
		//this.renderAll();	
	},
	methods: {
		canConfigure: function(cell) {
			var pageInstance = this.$services.page.instances[this.page.name];
			var components = pageInstance.components;
			return components[cell.id] && components[cell.id].configure;
		},
		configure: function(cell) {
			var pageInstance = this.$services.page.instances[this.page.name];
			var cellInstance = pageInstance.components[cell.id];
			cellInstance.configure();
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
				state: {}
			});
		},
		addRow: function(target) {
			if (!target.rows) {
				Vue.set(target, "rows", []);
			}
			target.rows.push({
				id: this.page.content.counter++,
				cells: []
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
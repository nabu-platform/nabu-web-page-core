// TODO: currently we repeat the content within, not the cell/row itself
// it seems more natural to repeat the thing the renderer is _on_ rather than the content?

// TODO: when in edit mode, still load the _first_ instance and set it as state in the local page
// this will allow for visual editing

// the components and functionalities are built around state in a page
// however, the problem in a loop is that, depending on the iteration, we have different state
// this different state can not co-exist at the root of the page, only one thing can be true at a time
// apart from a massive refactor in how state is accessed, the other solution is to create temporary pages
// if we have an array called "mydata.myarray" in the current page
// and we want to repeat over that _and_ keep the data responsive, we need to have a reference-copy of the entry
// because in our example the array is nested, we "could" mock an empty mydata and put in an iteration instead of an array
// however, than you can't access any other data in the mydata object (because its a mock)
// we could do more complex mocking but this seems contrived
// another option is to have you set a "local" variable e.g. myInstance which we make available in the variables of the temporary page


// we don't need to specifically define the events
// if you define an event inside a repeat (e.g. a button), it will already exist in the page and be known
// all we need to do is make sure we shuttle the events from our page fragments to this page


// TO BE CHECKED: if we expose all the operation parameters as a filter
// and you can bind to the state
// why do we need operation binding? do we need it? it seems redundant
nabu.page.provide("page-renderer", {
	title: "Repeat",
	name: "repeat",
	type: ["row", "cell"],
	component: "renderer-repeat",
	configuration: "renderer-repeat-configure",
	getState: function(container, page, pageParameters, $services) {
		var result = {};
		if (container.repeat) {
			result["recordIndex"] = {type: "int64"};
			if (container.repeat.operation) {
				var operation = $services.swagger.operations[container.repeat.operation];
				if (operation && operation.responses && operation.responses["200"] && operation.responses["200"].schema) {
					var properties = {};
					var definition = $services.swagger.resolve(operation.responses["200"].schema);
					var arrays = $services.page.getArrays(definition);
					if (arrays.length > 0) {
						var childDefinition = $services.page.getChildDefinition(definition, arrays[0]);
						if (childDefinition && childDefinition.items && childDefinition.items.properties) {
							nabu.utils.objects.merge(properties, childDefinition.items.properties);
						}
					}
					if (definition.properties) {
						Object.keys(definition.properties).map(function(field) {
							if (definition.properties[field].type == "array") {
								var items = definition.properties[field].items;
								if (items.properties) {
									nabu.utils.objects.merge(properties, items.properties);
								}
							}
						});
					}
					result.record = {properties:properties};
					result.records = {type: "array", items: {properties:record}};	
					
					var filters = {};
					// we also want to expose the parameters as input
					var parameters = operation.parameters;
					if (parameters) {
						parameters.forEach(function(x) {
							// reserved!
							if (x.name != "record") {
								filters[x.name] = x;
							}
						});
					}
					result.filter = {properties:filters};
				}
			}
			else if (container.repeat.array) {
				var record = {};
				var available = pageParameters;
				var arrayName = container.repeat.array;
				if (arrayName.indexOf("page.") == 0) {
					arrayName = arrayName.substring("page.".length);
				}
				var indexOfDot = arrayName.indexOf(".");
				var variable = indexOfDot < 0 ? arrayName : arrayName.substring(0, indexOfDot);
				var rest = indexOfDot < 0 ? null : arrayName.substring(indexOfDot + 1);
				if (available[variable]) {
					// we can have root arrays rather than part of something else
					// for example from a multiselect event
					if (!rest) {
						if (available[variable].items && available[variable].items.properties) {
							nabu.utils.objects.merge(record, available[variable].items.properties);
						}
					}
					else {
						var childDefinition = $services.page.getChildDefinition(available[variable], rest);
						if (childDefinition) {
							nabu.utils.objects.merge(record, childDefinition.items.properties);
						}
					}
				}
				result.record = {properties:record};
				result.records = {type: "array", items: {properties:record}};
			}
		}
		return {properties:result};
	},
	getChildComponents: function(target) {
		return [{
			title: "Repeat Content",
			name: "repeat-content",
			component: target.rows ? "row" : "column"
		}];
	},
	getActions: function(target) {
		var actions = [];
		// can only refresh if there is an operation
		if (target.repeat && target.repeat.operation) {
			var action = {
				title: "Refresh",
				name: "refresh",
				input: {
				},
				output: {
				}
			};
			// check if we are browseable
			var renderer = nabu.page.providers("page-renderer").filter(function(x) { return x.name == "repeat" })[0];
			if (renderer && renderer.getSpecifications(target).indexOf("pageable") >= 0) {
				// usually you refresh because something changed/was added/removed/...
				// in that case, the page you are on is unlikely to have the current details
				// so you want to reset the page count to 0
				// however, sometimes you want to refresh because some internal state was updated on the current page (e.g. task reprocessing)
				action.input.retainOffset = {
					type: "boolean"
				};
			}
			actions.push(action);
		}
		return actions;
	},
	getSpecifications: function(target) {
		// TODO: check that it is an operation _and_ it has limit/offset capabilities
		//return [];
		var specifications = [];
		if (target.repeat && target.repeat.operation) {
			var operation = application.services.swagger.operations[target.repeat.operation];
			if (operation) {
				var parameters = operation.parameters.map(function(x) { return x.name });
				if (parameters.indexOf("limit") >= 0 && parameters.indexOf("offset") >= 0) {
					specifications.push("pageable");
					specifications.push("browseable");
				}
				if (parameters.indexOf("orderBy") >= 0) {
					specifications.push("orderable");
				}
			}
		}
		return specifications;
		//return ["pageable", "browseable"];
	}
});

var $$rendererInstanceCounter = 0;
Vue.component("renderer-repeat", {
	template: "#renderer-repeat",
	mixins: [nabu.page.mixins.renderer],
	props: {
		page: {
			type: Object,
			required: true
		},
		// the target (cell or row)
		target: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		// whether or not we are in edit mode (we can do things slightly different)
		edit: {
			type: Boolean,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		}
	},
	data: function() {
		return {
			created: false,
			loadCounter: 0,
			// the instance counter is used to manage our pages on the router
			instanceCounter: $$rendererInstanceCounter++,
			loading: false,
			fragmentPage: null,
			// position counter to make each record unique
			position: 0,
			// the state in the original page, this can be used to write stuff like "limit" etc to
			// note that the "record" will not actually be in this
			state: {
				filter: {},
				records: [],
				// if we don't define the fields AND we don't use Vue.set to update them, they are not reactive!
				paging: {
					current: 0,
					total: 0,
					pageSize: 0,
					rowOffset: 0,
					totalCount: 0
				}
			}
		}
	},
	/*
	render: function(f) {
		console.log("rendering repeat", f);
		console.log("slots are", this.$slots);
		return f("div2", this.$slots.default);
	},
	*/
	created: function() {
		// the parameters that we pass in contain the bound values
		var self = this;
		var blacklist = ["records", "paging"];
		
		// the problem is, we want to do an initial load always
		// however, by the act of modifying the state if you have bindings, we trigger the watcher for state.filter which will also do a reload
		// so we want behavior that if we don't do any state mappings, we do an initial load
		// if a filter change comes in because of initial mapping, we ignore it
		var stateModified = false;
		Object.keys(this.parameters).forEach(function(key) {
			if (blacklist.indexOf(key) < 0 && self.parameters[key] != null) {
				Vue.set(self.state, key, self.parameters[key]);
				stateModified = true;
			}
		});
		
		if (!stateModified) {
			this.created = true;
		}
		
		this.loadPage();
		
		this.watchArray();
		
		// note that this is NOT an activate, we can not stop the rendering until the call is done
		// in the future we could add a "working" icon or a placeholder logic
		this.loadData();
	},
	computed: {
		alias: function() {
			return "fragment-renderer-repeat-" + this.instanceCounter;
		},
		operationParameters: function() {
			var parameters = {};
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			var self = this;
			if (this.target.repeat.bindings) {
				Object.keys(this.target.repeat.bindings).map(function(name) {
					if (self.target.repeat.bindings[name]) {
						var value = self.$services.page.getBindingValue(pageInstance, self.target.repeat.bindings[name], self);
						if (value != null && typeof(value) != "undefined") {
							parameters[name] = value;
						}
					}
				});
			}
			return parameters;
		}
	},
	watch: {
		// we don't want to watch paging, it is the output
		// TODO: we want to add a new field that serves as input to manipulate the limit!
		operationParameters: function() {
			this.loadData();	
		},
		"state.filter": {
			deep: true,
			handler: function(newValue) {
				if (this.created) {
					this.loadData();
				}
				else {
					this.created = true;
				}
			}
		}
	},
	beforeDestroy: function() {
		this.unloadPage();
	},
	methods: {
		getCounter: function() {
			return this.$services.page.pageCounter++;
		},
		getPageType: function() {
			var self = this;
			var pageType = null;
			if (this.parameters.pageType) {
				this.pageType = this.parameters.pageType;
			}
			else {
				// we check if there is a renderer in the path to this repeat
				// if so, that renderer can modify how we render the pages (e.g. a table)
				var path = this.$services.page.getTargetPath(this.page.content, this.target.id);
				path.reverse();
				path.forEach(function(x) {
					if (x.renderer && !pageType) {
						var renderer = self.$services.page.getRenderer(x.renderer);
						if (renderer && renderer.getPageType) {
							pageType = renderer.getPageType(x);
						}
					}
				})
			}
			return pageType;
		},
		getComponent: function() {
			var self = this;
			var pageType = this.getPageType();
			if (pageType) {
				var provider = nabu.page.providers("page-type").filter(function(x) {
					return x.name == pageType;
				})[0];
				if (provider && provider.repeatTag instanceof Function) {
					return provider.repeatTag(this.target);
				}
				else if (provider && provider.repeatTag) {
					return provider.repeatTag;
				}
				// if we are a cell, check if we have a celltag
				else if (provider && this.target.rows && provider.cellTag instanceof Function) {
					return provider.cellTag(this.target);
				}
				else if (provider && this.target.rows && provider.cellTag) {
					return provider.cellTag;
				}
				// if we are a row, check if we have a celltag
				else if (provider && this.target.cells && provider.rowTag instanceof Function) {
					return provider.rowTag(this.target);
				}
				else if (provider && this.target.cells && provider.rowTag) {
					return provider.rowTag;
				}
			}
			return "div";
		},
		onDragStart: function(event, record) {
			var name = this.target.repeat.dragName ? this.target.repeat.dragName : "default";
			this.$services.page.setDragData(event, "data-" + name, JSON.stringify(record));
		},
		watchArray: function() {
			if (this.target.repeat.array) {
				var self = this;
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				var targetArray = this.target.repeat.array;
				var current = pageInstance.get(targetArray);
				// if it doesn't exist yet, keep an eye on the page state
				// we tried to be more specific and watch direct parents but this _somehow_ failed
				if (current == null) {
					var unwatch = pageInstance.$watch("variables", function(newValue) {
						var result = pageInstance.get(self.target.repeat.array);
						if (result != null) {
							self.loadData();
							unwatch();
							self.watchArray();
						}
					}, {deep: true});
				}
				else {
					var stringified = JSON.stringify(current);
					if (targetArray.indexOf("page.") == 0) {
						targetArray = targetArray.substring("page.".length);
					}
					var watchKey = "variables." + targetArray;
					var unwatch = pageInstance.$watch(watchKey, function(newValue) {
						if (JSON.stringify(pageInstance.get(targetArray)) != stringified) {
							self.loadData();
							unwatch();
							// may have unset to null, changed to a different array,...
							self.watchArray();
						}
					}, {deep: true});
				}
			}
		},
		// TODO: allow the user to choose their own key in the record
		getKey: function(record) {
			if (record && record.id) {
				return record.id;
			}
			// sometimes we have arrays of uuids
			else if (record && typeof(record) == "string") {
				return record;
			}
			else if (record && record.hasOwnProperty("$position")) {
				return record["$position"];
			}
			else {
				return this.records.indexOf(record);
			}
		},
		runAction: function(action, value) {
			if (action == "jump-page") {
				return this.loadData(value.page);
			}
			else if (action == "refresh") {
				var retainOffset = value && value.retainOffset;
				return this.loadData(retainOffset ? this.state.paging.page : 0);
			}
			else if (action == "list-available") {
				
			}
			else if (action == "order-by") {
				
			}
			return this.$services.q.reject();
		},
		getRuntimeState: function() {
			return this.state;	
		},
		getParameters: function(record) {
			var result = {};
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			// whatever parameters we passed to the parent page are likely expected to the in the repeated page as well (?)
			// not true, we want the _state_ of the parent page, but this may be due to rest calls etc, we don't want to replay that
			// nabu.utils.objects.merge(result, pageInstance.parameters);
			//nabu.utils.objects.merge(result, this.getVariables());
			// we don't want to pass the entire state as parameters because this causes the repeats to be rerendered if anything changes
			if (this.target.runtimeAlias) {
				result[this.target.runtimeAlias] = {record:record, recordIndex: this.state.records.indexOf(record)};
			}
			return result;
		},
		getVariables: function() {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			return pageInstance.variables;
		},
		unloadPage: function() {
			this.$services.router.unregister("fragment-renderer-repeat-" + this.instanceCounter);
		},
		beforeMount: function(component) {
			this.mapVariables(component);
		},
		mapVariables: function(target) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			var self = this;
			Object.keys(pageInstance.variables).forEach(function(key) {
				// not interested in changes to itself
				if (key != self.target.runtimeAlias) {
					if (target.set) {
						if (target.variables[key] != pageInstance.variables[key]) {
							target.set(key, pageInstance.variables[key]);
						}
					}
					else {
						if (target[key] != pageInstance.variables[key]) {
							Vue.set(target, key, pageInstance.variables[key]);
						}
					}
				}
			});
		},
		mounted: function(component) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			// TODO: subscribe to all events and emit them to this page
			component.$on("hook:beforeDestroy", function() {
				console.log("Destroying repeated fragmented page");
			});
			// we don't need to explicitly unsubscribe? once the page gets destroyed, its gone anyway
			component.subscribe("$any", function(name, value) {
				if (name != "$load") {
					pageInstance.emit(name, value);
				}
			});
			var self = this;
			// map variables initially to the parameters
			// this _somehow_ breaks reactivity on the page
//						mapVariables(parameters);
			// we want to keep the variables up to date without having the route-render continuously rerender the page
			var unwatch = pageInstance.$watch("variables", function() {
				if (component) {
					self.mapVariables(component);
				}
			}, {deep: true});
			
			component.$on("hook:beforeDestroy", function() {
				unwatch();
			});
		},
		uniquify: function() {
			var self = this;
			this.state.records.forEach(function(record) {
				if (!record.hasOwnProperty("$position") && typeof(record) != "string" && !(record instanceof String)) {
					record["$position"] = self.position++;
				}
			});
		},
		// in the future we can add a "load more" event support, we then listen to that event and load more data, this means we want to append
		// currently we don't do anything special with limit and offset, you can fill them in in the bindings if you want
		// we will just do the call as a whole, assuming it is a limited service result
		// in the future we can hide the limit/offset inputs and instead expose them as state so you can directly write to them (?)
		loadData: function(page, append) {
			this.loadCounter++;
			var self = this;
			// we want to call an operation
			if (this.target.repeat && this.target.repeat.operation) {
				var parameters = this.operationParameters;
				// local state variables win from passed in ones!
				if (this.state.filter) {
					Object.keys(this.state.filter).forEach(function(key) {
						// someone might still attempt to write to record?
						// by default the state has no keys
						// any key available is explicitly written by the user, so even a null value is an active decision
						if (key != "record") {
							parameters[key] = self.state.filter[key];
						}
					});
				}
				// if we want to load a certain page, we need a limit
				if (page != null) {
					if (parameters.limit == null) {
						parameters.limit = 10;
					}
					parameters.offset = parameters.limit * page;
				}
				
				this.loading = true;
				if (!append) {
					self.state.records.splice(0);
				}
				return this.$services.swagger.execute(this.target.repeat.operation, parameters).then(function(list) {
					if (!append) {
						self.state.records.splice(0);
					}
					if (list) {
						var arrayFound = false;
						var findArray = function(root) {
							Object.keys(root).forEach(function(field) {
								if (root[field] instanceof Array && !arrayFound) {
									root[field].forEach(function(x, i) {
										if (x) {
											x.$position = i;
										}
									});
									nabu.utils.arrays.merge(self.state.records, root[field]);
									arrayFound = true;
								}
								if (!arrayFound && typeof(root[field]) === "object" && root[field] != null) {
									findArray(root[field]);
								}
							});
						}
						findArray(list);
						
						var pageFound = false;
						var findPage = function(root) {
							Object.keys(root).forEach(function(field) {
								// check if we have an object that has the necessary information
								if (typeof(root[field]) === "object" && root[field] != null && !pageFound) {
									// these are the two fields we use and map, check if they exist
									if (root[field].current != null && root[field].total != null) {
										nabu.utils.objects.merge(self.state.paging, root[field]);
										pageFound = true;
									}
									// recurse
									if (!pageFound) {
										findPage(root[field]);
									}
								}
							});
						}
						findPage(list);
					}
					self.uniquify();
					self.loading = false;
				}, function(error) {
					// TODO: what in case of error?
					self.loading = false;
				})
			}
			else if (this.target.repeat && this.target.repeat.array) {
				if (!append) {
					this.state.records.splice(0, this.state.records.length);
				}
				var result = this.$services.page.getPageInstance(this.page, this).get(this.target.repeat.array);

				if (result) {
					nabu.utils.arrays.merge(this.state.records, result);
				}
				self.uniquify();
				return this.$services.q.resolve(result);
			}
		},
		// create a custom route for rendering
		loadPage: function() {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			
			this.unloadPage();
			if (this.target.runtimeAlias) {
				var content = {
					"rows": [],
					"counter": 1,
					"variables": [],
					"query": [],
					"actions": [],
					"class": null,
					"initial": false,
					"menuX": 0,
					"menuY": 0,
					"states": [],
					"category": "Other Category",
					"slow": false,
					"name": this.alias,
					"parameters": [],
					"readOnly": true,
					"pageType": this.getPageType(),
					// you can optimze the rows by throwing away the page wrapper
					// currently this also throws away edit mode so we can only globally enable this once we have moved the editing outside of the page!
					// no longer needed, vue was complaining about two roots so made an optimized derivative component
					"optimizeRows": false
				};
				// add our local value
				content.parameters.push({
					name: this.target.runtimeAlias,
					// we can be more specific about the type, not sure if it is necessary though
					type: 'string',
					format: null,
					default: null,
					global: false,
					// we can listen to events and take a value from them to update the current value
					// e.g. we could update a search parameter if you select something
					listeners: []
				});
				// we have a row, just push it to the rows
				if (this.target.rows) {
					nabu.utils.arrays.merge(content.rows, this.target.rows);
				}
				// we have a cell
				else if (this.target.cells) {
					var row = {
						// use an id that definitely does not collide with the content
						id: -1,
						state: {},
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
					};
					nabu.utils.arrays.merge(row.cells, this.target.cells);
					content.rows.push(row);
				}
				var page = {
					name: content.name,
					content: content
				}
				this.fragmentPage = page;
				var self = this;
				var route = {
					alias: page.name,
					enter: function(parameters, mask) {
						var mapVariables = function(target) {
							Object.keys(pageInstance.variables).forEach(function(key) {
								// not interested in changes to itself
								if (key != self.target.runtimeAlias) {
									if (target.set) {
										if (target.variables[key] != pageInstance.variables[key]) {
											target.set(key, pageInstance.variables[key]);
										}
									}
									else {
										if (target[key] != pageInstance.variables[key]) {
											Vue.set(target, key, pageInstance.variables[key]);
										}
									}
								}
							});
						}
						
						// map variables initially to the parameters
						// this _somehow_ breaks reactivity on the page
//						mapVariables(parameters);
						
						var newPage = null;
						// we want to keep the variables up to date without having the route-render continuously rerender the page
						var unwatch = pageInstance.$watch("variables", function() {
							if (newPage) {
								mapVariables(newPage);
							}
						}, {deep: true});
						console.log("--------------> wtf???");
						newPage = new nabu.page.views.Page({template: "n-page-optimized", propsData: {
							page: page, 
							parameters: parameters, 
							stopRerender: parameters ? parameters.stopRerender : false, 
							pageInstanceId: self.$services.page.pageCounter++, 
							masked: mask 
						}, beforeDestroy: function() {
							unwatch();
						// the sweet spot to make sure rules etc are initialized correctly but not to interrupt other things
						}, beforeMount: function() {
							mapVariables(this);
						}});
						console.log("newpag is",newPage);
						return newPage;
					},
					// yes it's a page, but we don't want it treated as such
					isPage: false,
					initial: false,
					properties: page.content.properties ? page.content.properties : []
				};
				this.$services.router.register(route);
			}
		}
	}
});


Vue.component("renderer-repeat-configure", {
	template: "#renderer-repeat-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		// the target (cell or row)
		target: {
			type: Object,
			required: true
		},
		// whether or not we are in edit mode (we can do things slightly different)
		edit: {
			type: Boolean,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		}
	},
	created: function() {
		if (!this.target.repeat) {
			Vue.set(this.target, "repeat", {});
		}
		if (!this.target.repeat.bindings) {
			Vue.set(this.target.repeat, "bindings", {});
		}	
	},
	computed: {
		operationParameters: function() {
			var result = [];
			if (this.target.repeat.operation) {
				// could be an invalid operation?
				if (this.$services.swagger.operations[this.target.repeat.operation]) {
					var parameters = this.$services.swagger.operations[this.target.repeat.operation].parameters;
					if (parameters) {
						nabu.utils.arrays.merge(result, parameters.map(function(x) { return x.name }));
					}
				}
			}
			return result;
		}
	}
});
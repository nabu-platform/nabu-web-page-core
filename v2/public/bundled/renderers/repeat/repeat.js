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
nabu.page.provide("page-renderer", {
	title: "Repeat",
	name: "repeat",
	type: ["row", "cell"],
	component: "renderer-repeat",
	configuration: "renderer-repeat-configure",
	getState: function(container, page, pageParameters, $services) {
		var result = {};
		if (container.repeat) {
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
					result.filters = {properties:filters};
				}
			}
			else if (container.repeat.array) {
				var record = {};
				var available = pageParameters;
				var indexOfDot = container.repeat.array.indexOf(".");
				var variable = indexOfDot < 0 ? container.repeat.array : container.repeat.array.substring(0, indexOfDot);
				var rest = indexOfDot < 0 ? null : container.repeat.array.substring(indexOfDot + 1);
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
			}
		}
		return {properties:result};
	},
	getSpecifications: function(target) {
		// TODO: check that it is an operation _and_ it has limit/offset capabilities
		return [];
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
			records: [{
				value: "firstValue"
			}, {
				value: "secondValue"
			}],
			// the instance counter is used to manage our pages on the router
			instanceCounter: $$rendererInstanceCounter++,
			paging: {},
			loading: false,
			// the state in the original page, this can be used to write stuff like "limit" etc to
			// note that the "record" will not actually be in this
			state: {}
		}
	},
	created: function() {
		this.loadPage();
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
		operationParameters: function() {
			this.loadData();	
		},
		state: {
			deep: true,
			handler: function(newValue) {
				this.loadData();
			}
		}
	},
	beforeDestroy: function() {
		this.unloadPage();
	},
	methods: {
		getRuntimeState: function() {
			return this.state;	
		},
		getParameters: function(record) {
			var result = {};
			if (this.target.runtimeAlias) {
				result[this.target.runtimeAlias] = {record:record};
			}
			return result;
		},
		unloadPage: function() {
			this.$services.router.unregister("fragment-renderer-repeat-" + this.instanceCounter);
		},
		mounted: function(component) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			// TODO: subscribe to all events and emit them to this page
			component.$on("hook:beforeDestroy", function() {
				console.log("Destroying repeated fragmented page");
			});
			// we don't need to explicitly unsubscribe? once the page gets destroyed, its gone anyway
			component.subscribe("$any", function(name, value) {
				pageInstance.emit(name, value);
			});
		},
		// in the future we can add a "load more" event support, we then listen to that event and load more data, this means we want to append
		// currently we don't do anything special with limit and offset, you can fill them in in the bindings if you want
		// we will just do the call as a whole, assuming it is a limited service result
		// in the future we can hide the limit/offset inputs and instead expose them as state so you can directly write to them (?)
		loadData: function(append) {
			console.log("loading repeat", this.target);
			var self = this;
			// we want to call an operation
			if (this.target.repeat && this.target.repeat.operation) {
				var parameters = this.operationParameters;
				// local state variables win from passed in ones!
				Object.keys(this.state).forEach(function(key) {
					// someone might still attempt to write to record?
					// by default the state has no keys
					// any key available is explicitly written by the user, so even a null value is an active decision
					if (key != "record") {
						parameters[key] = self.state[key];
					}
				});
				
				this.loading = true;
				this.$services.swagger.execute(this.target.repeat.operation, parameters).then(function(list) {
					if (!append) {
						self.records.splice(0);
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
									nabu.utils.arrays.merge(self.records, root[field]);
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
										nabu.utils.objects.merge(self.paging, root[field]);
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
					self.loading = false;
				}, function(error) {
					// TODO: what in case of error?
					self.loading = false;
				})
			}
			else if (this.target.repeat && this.target.repeat.array) {
				if (!append) {
					this.records.splice(0, this.records.length);
				}
				var records = this.$services.page.getPageInstance(this.page, this).get(this.target.repeat.array);
				if (records) {
					nabu.utils.arrays.merge(this.records, records);
				}
			}
		},
		// create a custom route for rendering
		loadPage: function() {
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
					"readOnly": true
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
				var self = this;
				var route = {
					alias: page.name,
					enter: function(parameters, mask) {
						return new nabu.page.views.Page({propsData: {
							page: page, 
							parameters: parameters, 
							stopRerender: parameters ? parameters.stopRerender : false, 
							pageInstanceId: self.$services.page.pageCounter++, 
							masked: mask 
						}});
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
			console.log("operation", this.target.repeat.operation);
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
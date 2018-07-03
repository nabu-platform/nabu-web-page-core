if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

nabu.page.views.PageForm = Vue.extend({
	template: "#page-form",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	data: function() {
		return {
			configuring: false,
			result: {},
			currentPage: null,
			autoMapFrom: null
		}
	},
	computed: {
		operation: function() {
			return this.cell.state.operation ? this.$services.swagger.operations[this.cell.state.operation] : null;
		},
		body: function() {
			var operation = this.$services.swagger.operations[this.cell.state.operation];
			if (operation) {
				var self = this;
				for (var i = 0; i < operation.parameters.length; i++) {
					var parameter = operation.parameters[i];
					if (parameter.in == "body") {
						return self.$services.swagger.resolve(parameter);
					}
				};
			}
			return {};
		},
		availableParameters: function() {
			return this.$services.page.getAvailableParameters(this.page, this.cell);
		},
		fieldsToAdd: function() {
			var fields = [];
			var self = this;
			Object.keys(this.cell.bindings).map(function(key) {
				fields.push(key);
			});
			return fields;
		}
	},
	created: function() {
		this.normalize(this.cell.state);
		
		var self = this;
		var pageInstance = self.$services.page.getPageInstance(self.page, self);
		if (this.cell.bindings) {
			Object.keys(this.cell.bindings).map(function(key) {
				if (self.cell.bindings[key]) {
					Vue.set(self.result, key, pageInstance.get(self.cell.bindings[key]));
				}
			});
		}
		
		// get the first page
		this.currentPage = this.cell.state.pages[0];
	},
	methods: {
		automap: function() {
			var source = this.availableParameters[this.autoMapFrom];
			var self = this;
			Object.keys(this.cell.bindings).map(function(key) {
				// only automap those that are not filled in
				if (!self.cell.bindings[key]) {
					var keyToCheck = key.indexOf(".") < 0 ? key : key.substring(key.indexOf(".") + 1);
					if (!!source.properties[keyToCheck]) {
						Vue.set(self.cell.bindings, key, self.autoMapFrom + "." + keyToCheck);
					}
				}
			});
		},
		isHidden: function(field) {
			return field.hidden && this.$services.page.isCondition(field.hidden, this.createResult(), this);
		},
		getGroupedFields: function(page) {
			var groupedFields = [];
			page.fields.map(function(field) {
				// if we want to join the current group, just do that
				if (field.joinGroup === true) {
					if (groupedFields.length == 0) {
						groupedFields.push({fields:[]});
					}
					groupedFields[groupedFields.length - 1].fields.push(field);
				}
				else {
					groupedFields.push({group:field.group, fields:[field]});
				}
			});
			return groupedFields;
		},
		nextPage: function() {
			var messages = this.$refs.form.validate();
			if (!messages.length) {
				this.currentPage = this.cell.state.pages[this.cell.state.pages.indexOf(this.currentPage) + 1];
			}
		},
		deletePage: function(page) {
			var self = this;
			this.$confirm({
				message: "Are you sure you want to delete the form page '" + page.name + "'?"
			}).then(function() {
				self.cell.state.pages.splice(self.cell.state.pages.indexOf(page), 1);
			});
		},
		addPage: function() {
			this.cell.state.pages.push({
				name: "Unnamed Page",
				title: null,
				fields: []
			});
		},
		configure: function() {
			this.configuring = true;	
		},
		normalize: function(state) {
			if (!state.title) {
				Vue.set(state, "title", null);
			}
			if (!state.immediate) {
				Vue.set(state, "immediate", false);
			}
			if (!state.pages) {
				Vue.set(state, "pages", []);
			}
			// if we still have fields directly in the state, it is actually a form with one page (the old way)
			if (state.fields) {
				state.pages.push({
					name: "Form Fields",
					title: null,
					fields: state.fields
				});
				Vue.delete(state, "fields");
			}
			if (!state.pages.length) {
				state.pages.push({
					name: "Form Fields",
					title: null,
					fields: []
				});
			}
			if (!state.class) {
				Vue.set(state, "class", null);
			}
			if (!state.ok) {
				Vue.set(state, "ok", "Ok");
			}
			if (!state.next) {
				Vue.set(state, "next", "Next");
			}
			if (!state.cancel) {
				Vue.set(state, "cancel", "Cancel");
			}
			if (!state.event) {
				Vue.set(state, "event", null);
			}
			if (!state.synchronize) {
				Vue.set(state, "synchronize", false);
			}
		},
		getEvents: function() {
			var result = {};
			if (this.operation && this.cell.state.event) {
				var response = this.operation.responses["200"];
				var schema = null;
				if (response && response.schema) {
					schema = this.$services.swagger.resolve(response.schema);
				}
				result[this.cell.state.event] = schema ? schema : {};
			}
			return result;
		},
		getOperations: function(name) {
			var self = this;
			return this.$services.page.getOperations(function(operation) {
				// must be a put or post
				return (operation.method.toLowerCase() == "put" || operation.method.toLowerCase() == "post")
					// and contain the name fragment (if any)
					&& (!name || operation.id.toLowerCase().indexOf(name.toLowerCase()) >= 0);
			});
		},
		getField: function(name) {
			for (var i = 0; i < this.cell.state.pages.length; i++) {
				var field = this.cell.state.pages[i].fields.filter(function(x) {
					return x.name == name;
				})[0];
				if (field) {
					return field;
				}
			}
		},
		updateOperation: function(operation) {
			this.cell.state.operation = operation.id;
			var bindings = {};
			if (operation.parameters) {
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
									bindings[newKey] = self.cell.bindings && self.cell.bindings[newKey]
										? self.cell.bindings[newKey]
										: null;
								}
								if (type.schema.properties[key].type == "object" || (type.schema.properties[key].type == "array" && type.schema.properties[key].items.properties)) {
									var properties = type.schema.properties[key].type == "array"
										? type.schema.properties[key].items.properties 
										: type.schema.properties[key].properties;
									Object.keys(properties).map(function(key2) {
										var newKey = "body." + key + "." + key2;
										bindings[newKey] = self.cell.bindings && self.cell.bindings[newKey]
											? self.cell.bindings[newKey]
											: null;	
									});
								}
							});
						}
					}
					else {
						bindings[parameter.name] = self.cell.bindings && self.cell.bindings[parameter.name]
							? self.cell.bindings[parameter.name]
							: null;
					}
				});
			}
			// if we are event driven, do a best-effort mapping if the fields match
			if (this.cell.on) {
				var self = this;
				var pageInstance = self.$services.page.getPageInstance(self.page, self);
				var event = pageInstance.getEvents()[this.cell.on];
				if (event && event.properties) {
					Object.keys(bindings).map(function(key) {
						var field = key;
						if (field.indexOf("body.") == 0) {
							field = field.substring("body.".length);
						}
						if (event.properties[field]) {
							bindings[key] = self.cell.on + "." + field;
						}
					});
				}
			}
			// TODO: is it OK that we simply remove all bindings?
			// is the table the only one who sets bindings here?
			Vue.set(this.cell, "bindings", bindings);
		},
		getSchemaFor: function(field) {
			if (!field) {
				return null;
			}
			var operation = this.$services.swagger.operations[this.cell.state.operation];
			var result = null;
			if (operation) {
				var self = this;
				// body parameter
				if (field.indexOf("body.") == 0) {
					var recursiveGet = function(schema, parts, index) {
						if (schema.items) {
							schema = schema.items;
						}
						var properties = schema.properties;
						if (properties && properties[parts[index]]) {
							if (index < parts.length - 1) {
								return recursiveGet(properties[parts[index]], parts, index + 1);
							}
							else {
								var result = properties[parts[index]];
								result.required = schema.required && schema.required.indexOf(parts[index]) >= 0;
								return result;
							}
						}
					}
					var body = this.body;
					var parts = field.substring("body.".length).split(".");
					result = body.schema ? recursiveGet(body.schema, parts, 0) : null;
				}
				// non-body parameter
				else {
					for (var i = 0; i < operation.parameters.length; i++) {
						var parameter = operation.parameters[i];
						if (parameter.in != "body" && parameter.name == field) {
							result = parameter;
						}
					};
				}
			}
			return result;
		},
		isList: function(field) {
			var field = this.getSchemaFor(field);
			return field && field.type == "array";
		},
		isPartOfList: function(field) {
			// only things in the body can be a list (?)
			if (!field || field.indexOf("body.") != 0) {
				return false;
			}
			var parts = field.substring("body.".length).split(".");
			var schema = this.body.schema;
			for (var i = 0; i < parts.length - 1; i++) {
				if (schema.items) {
					schema = schema.items;
				}
				schema = schema.properties[parts[i]];
				if (schema && schema.type == "array") {
					return true;	
				}
			}
			return false;
		},
		getProvidedListComponent: function(type) {
			var provided = nabu.page.providers("page-form-list-input").filter(function(x) {
				 return x.name == type;
			})[0];
			return provided ? provided.component : null;	
		},
		addInstanceOfField: function(field) {
			if (!this.result[field.name]) {
				Vue.set(this.result, field.name, []);
			}
			var schema = this.getSchemaFor(field.name);
			if (schema.items) {
				schema = schema.items;
			}
			var result = null;
			if (schema.properties) {
				result = {};
				Object.keys(schema.properties).map(function(key) {
					result[key] = null;
				});
			}
			this.result[field.name].push(result);
		},
		createResult: function() {
			var result = this.result;
			var transformed = {};
			Object.keys(result).map(function(name) {
				var parts = name.split(".");
				var tmp = transformed;
				for (var i = 0; i < parts.length - 1; i++) {
					if (!tmp[parts[i]]) {
						Vue.set(tmp, parts[i], {});
					}
					tmp = tmp[parts[i]];
				}
				Vue.set(tmp, parts[parts.length - 1], result[name]);
				// if it is a complex field, set the string value as well
				// this makes it easier to check later on if it has been set or not
				if (name.indexOf(".") > 0) {
					// set the full name field as well
					transformed[name] = result[name];
				}
			});
			var self = this;
			// no need, this is bound in the created() hook into this.result so picked up in the above mapping (unless overwritten)
			var pageInstance = self.$services.page.getPageInstance(self.page, self);
			// bind additional stuff from the page
			Object.keys(this.cell.bindings).map(function(name) {
				// don't overwrite manually set values
				if (self.cell.bindings[name] && Object.keys(transformed).indexOf(name) < 0) {
					var parts = name.split(".");
					var tmp = transformed;
					for (var i = 0; i < parts.length - 1; i++) {
						if (!tmp[parts[i]]) {
							Vue.set(tmp, parts[i], {});
						}
						tmp = tmp[parts[i]];
					}
					Vue.set(tmp, parts[parts.length - 1], self.$services.page.getBindingValue(pageInstance, self.cell.bindings[name]));
				}
			});
			return transformed;
		},
		changed: function() {
			if (this.cell.state.immediate) {
				this.doIt();
			}
		},
		doIt: function() {
			var messages = this.$refs.form.validate();
			if (!messages.length) {
				// commit the form
				// refresh things that are necessary
				// send out event! > can use this to refresh stuff!
				// globale parameters that we can pass along
				var self = this;
				var result = this.createResult();
				this.$services.swagger.execute(this.cell.state.operation, result).then(function(returnValue) {
					var pageInstance = self.$services.page.getPageInstance(self.page, self);
					// if we want to synchronize the values, do so
					if (self.cell.state.synchronize) {
						Object.keys(self.cell.bindings).map(function(name) {
							pageInstance.set(self.cell.bindings[name], self.result[name]);
						});
					}
					if (self.cell.state.event) {
						pageInstance.emit(self.cell.state.event, returnValue);
					}
					self.$emit("close");
				}, function(error) {
					self.error = "Form submission failed";
				});
			}
		},
		up: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index > 0) {
				var replacement = this.cell.state.fields[index - 1];
				this.cell.state.fields.splice(index - 1, 1, this.cell.state.fields[index]);
				this.cell.state.fields.splice(index, 1, replacement);
			}
		},
		down: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index < this.cell.state.fields.length - 1) {
				var replacement = this.cell.state.fields[index + 1];
				this.cell.state.fields.splice(index + 1, 1, this.cell.state.fields[index]);
				this.cell.state.fields.splice(index, 1, replacement);
			}
		},
		upAll: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index > 0) {
				var replacement = this.cell.state.fields[0];
				this.cell.state.fields.splice(0, 1, this.cell.state.fields[index]);
				this.cell.state.fields.splice(index, 1, replacement);
			}
		},
		downAll: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index < this.cell.state.fields.length - 1) {
				var replacement = this.cell.state.fields[this.cell.state.fields.length - 1];
				this.cell.state.fields.splice(this.cell.state.fields.length - 1, 1, this.cell.state.fields[index]);
				this.cell.state.fields.splice(index, 1, replacement);
			}
		}
	}
});

Vue.component("page-form-field", {
	template: "#page-form-field",
	props: {
		page: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: false,
		},
		schema: {
			type: Object,
			required: false
		},
		field: {
			type: Object,
			required: true
		},
		value: {
			required: true
		},
		label: {
			type: Boolean,
			required: false,
			default: true
		},
		timeout: {
			type: Number,
			required: false,
			default: 600
		},
		isDisabled: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	created: function() {
		// if it is a fixed field, just emit the value
		if (this.field.fixed) {
			this.$emit("input", this.field.value);
		}
	},
	// mostly a copy paste from form-section
	data: function() {
		return {
			labels: []
		}
	},
	computed: {
		definition: function() {
			return nabu.utils.vue.form.definition(this);
		},
		mandatory: function() {
			return nabu.utils.vue.form.mandatory(this);
		},
		fieldLabel: function() {
			if (!this.label) {
				return null;
			}
			return this.field.label ? this.field.label : this.field.name;
		}
	},
	methods: {
		getProvidedComponent: function(type) {
			var provided = nabu.page.providers("page-form-input").filter(function(x) {
				 return x.name == type;
			})[0];
			return provided ? provided.component : null;	
		},
		validate: function(soft) {
			var messages = nabu.utils.vue.form.validateChildren(this, soft);
			if (this.validator) {
				var additional = this.validator(this.value);
				if (additional && additional.length) {
					for (var i = 0; i < additional.length; i++) {
						additional[i].component = this;
						if (typeof(additional[i].context) == "undefined") {
							additional[i].context = [];
						}
						messages.push(additional[i]);
					}
				}
			}
			return messages;
		}
	},
	events: {
		'$vue.child.added': function(child) {
			if (child.label) {
				// we pass in the entire component because we are interested in the "hide" property it may have
				// if we simply pass in the hide, it doesn't work...
				this.labels.push({ 
					name: child.label,
					component: child
				});
			}
			else if (!this.labels.length && child.labels) {
				nabu.utils.arrays.merge(this.labels, child.labels);
			}
			else {
				this.labels.push(null);
			}
		}
	}
});

Vue.component("page-form-configure", {
	template: "#page-form-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		},
		title: {
			type: String,
			required: true
		},
		// string list of field names
		possibleFields: {
			type: Array,
			required: true
		},
		// field values
		fields: {
			type: Array,
			required: true
		},
		isList: {
			type: Function,
			required: false
		},
		editName: {
			type: Boolean,
			required: false
		},
		groupable: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	methods: {
		up: function(field) {
			var index = this.fields.indexOf(field);
			if (index > 0) {
				var replacement = this.fields[index - 1];
				this.fields.splice(index - 1, 1, this.fields[index]);
				this.fields.splice(index, 1, replacement);
			}
		},
		down: function(field) {
			var index = this.fields.indexOf(field);
			if (index < this.fields.length - 1) {
				var replacement = this.fields[index + 1];
				this.fields.splice(index + 1, 1, this.fields[index]);
				this.fields.splice(index, 1, replacement);
			}
		},
		upAll: function(field) {
			var index = this.fields.indexOf(field);
			if (index > 0) {
				var replacement = this.fields[0];
				this.fields.splice(0, 1, this.fields[index]);
				this.fields.splice(index, 1, replacement);
			}
		},
		downAll: function(field) {
			var index = this.fields.indexOf(field);
			if (index < this.fields.length - 1) {
				var replacement = this.fields[this.fields.length - 1];
				this.fields.splice(this.fields.length - 1, 1, this.fields[index]);
				this.fields.splice(index, 1, replacement);
			}
		},
		addField: function() {
			this.fields.push({
				name: null,
				label: null,
				description: null,
				type: null,
				enumerations: [],
				value: null,
				group: null,
				joinGroup: false
			})
		}
	}
});

Vue.component("page-form-configure-single", {
	template: "#page-form-configure-single",
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		},
		field: {
			type: Object,
			required: true
		},
		possibleFields: {
			type: Array,
			required: true
		},
		allowLabel: {
			type: Boolean,
			required: false,
			default: true
		},
		allowDescription: {
			type: Boolean,
			required: false,
			default: true
		},
		isList: {
			type: Function,
			required: false
		},
		groupable: {
			type: Boolean,
			required: false,
			default: false
		},
		hidable: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	created: function() {
		this.normalize(this.field);
	},
	computed: {
		types: function() {
			var provided = [];
			if (this.isList && this.isList(this.field.name)) {
				nabu.utils.arrays.merge(provided, nabu.page.providers("page-form-list-input").map(function(x) { return x.name }));
			}
			else {
				provided.push("fixed");
				nabu.utils.arrays.merge(provided, nabu.page.providers("page-form-input").map(function(x) { return x.name }));
			}
			provided.sort();
			return provided;
		}
	},
	methods: {
		getProvidedConfiguration: function(type) {
			var provided = nabu.page.providers(this.isList && this.isList(this.field.name) ? "page-form-list-input" : "page-form-input").filter(function(x) {
				 return x.name == type;
			})[0];
			return provided ? provided.configure : null;
		},
		normalize: function(field) {
			if (!field.name) {
				Vue.set(field, "name", null);
			}
			if (!field.label) {
				Vue.set(field, "label", null);
			}
			if (!field.description) {
				Vue.set(field, "description", null);
			}
			if (!field.type) {
				Vue.set(field, "type", null);
			}
			if (!field.enumerations) {
				Vue.set(field, "enumerations", []);
			}
			if (!field.value) {
				Vue.set(field, "value", null);
			}
		}
	}
});
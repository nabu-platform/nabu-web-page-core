Vue.component("page-form-list-input-predefined-configure", {
	template: "#page-form-list-input-predefined-configure",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		// the fragment this image is in
		field: {
			type: Object,
			required: true
		}
	},
	computed: {
		operation: function() {
			return this.field.fieldProviderOperation ? this.$services.swagger.operations[this.field.fieldProviderOperation] : null;
		},
		// copy paste from data.js
		definition: function() {
			var properties = {};
			if (this.operation && this.operation.responses["200"]) {
				var definition = this.$services.swagger.resolve(this.operation.responses["200"].schema);
				//var definition = this.$services.swagger.definition(schema["$ref"]);
				if (definition.properties) {
					var self = this;
					Object.keys(definition.properties).map(function(field) {
						if (definition.properties[field].type == "array") {
							var items = definition.properties[field].items;
							if (items.properties) {
								nabu.utils.objects.merge(properties, items.properties);
							}
						}
					});
				}
			}
			return properties;
		},
		availableFields: function() {
			return this.$services.page.getSimpleKeysFor({properties:this.definition});
		}
	},
	methods: {
		// copy pasted from table getOperations
		listOperations: function(name) {
			var self = this;
			return this.$services.page.getOperations(function(operation) {
				// must be a get
				var isAllowed = operation.method.toLowerCase() == "get"
					// and contain the name fragment (if any)
					&& (!name || operation.id.toLowerCase().indexOf(name.toLowerCase()) >= 0)
					// must have _a_ response
					&& operation.responses["200"];
				// we also need at least _a_ complex array in the results
				if (isAllowed) {
					var schema = operation.responses["200"] ? operation.responses["200"].schema : null;
					if (schema) {
						var definition = self.$services.swagger.definition(schema["$ref"]);
						// now we need a child in the definition that is a record array
						// TODO: we currently don't actually check for a complex array, just any array, could be an array of strings...
						isAllowed = false;
						if (definition.properties) {
							Object.keys(definition.properties).map(function(field) {
								if (definition.properties[field].type == "array") {
									isAllowed = true;
								}
							});
						}
					}
				}
				return isAllowed;
			}).map(function(x) {
				 return x.id;
			});	
		},
		}
	}
});

Vue.component("page-form-list-input-predefined", {
	template: "#page-form-list-input-predefined",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		field: {
			type: Object,
			required: true
		},
		value: {
			required: true
		},
		label: {
			type: String,
			required: false
		},
		timeout: {
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		schema: {
			type: Object,
			required: false
		}
	},
	data: function() {
		return {
			fields: []
		}
	},
	created: function () {
		var self = this;
		if (this.field.fieldProviderOperation) {
			this.$services.swagger.execute(this.field.fieldProviderOperation).then(function(list) {
				if (list) {
					Object.keys(list).map(function(key) {
						if (list[key] instanceof Array) {
							nabu.utils.arrays.merge(self.fields, list[key].map(function(x) {
								var type = self.field.typeField ? x[self.field.typeField] : null;
								var name = self.field.nameField ? x[self.field.nameField] : null;
								var nameCounter = 1;
								var label = self.field.labelField ? x[self.field.labelField] : null;
								var value = self.field.valueField ? x[self.field.valueField] : null;
								var result = {
									type: type == null ? "string" : type,
									name: name == null ? "unnamed" + nameCounter++ : name,
									label: label == null ? (name == null ? "%{Unnamed}" : name) : label,
									value: value
								}
								if (value != null) {
									self.value[result.name] = value;
								}
								// can map additional stuff like required, pattern,...
								Object.keys(list[key]).map(function(additional) {
									if (additional != self.field.typeField && additional != self.field.nameField && additional != self.field.labelField&& additional != self.field.valueField) {
										result[additional] = list[key][additional];
									}
								});
								return result;
							}));
						}
					});
				}
			});
		}
	},
	methods: {
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		}
	}
});


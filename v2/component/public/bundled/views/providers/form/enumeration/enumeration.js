Vue.component("enumeration-provider", {
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
		}
	},
	data: function() {
		return {
			provider: null
		}
	},
	created: function() {
		if (this.field.provider == "provider") {
			this.provider = this.getProvider();
		}
	},
	methods: {
		// enumerationOperation: null,
		// enumerationFormatter
		// enumerationFieldLabel: null,
		// enumerationFieldValue: null,
		// enumerationOperationQuery: null,
		// enumerationOperationBinding: {}
		enumerationFilter: function(value) {
			return this.enumerationFilterAny(value, false);
		},
		// if we set the "asResolve", we are actually resolving the existing value, so for example if you have an ID already
		// and you want to resolve it to the full object so you can get the correct label to show, it will be called with the resolve id
		// the query is used to find _new_ values
		enumerationFilterAny: function(value, asResolve) {
			if (this.field.provider == "operation") {
				if (!this.field.enumerationOperation) {
					return [];
				}
				var parameters = {
					limit: 20
				};
				if (!asResolve && this.field.enumerationOperationQuery) {
					parameters[this.field.enumerationOperationQuery] = value;
				}
				else if (asResolve && this.field.enumerationOperationResolve) {
					parameters[this.field.enumerationOperationResolve] = value;
				}
				var self = this;
				// map any additional bindings
				var pageInstance = self.$services.page.getPageInstance(self.page, self);
				if (this.field.enumerationOperationBinding) {
					Object.keys(this.field.enumerationOperationBinding).map(function(key) {
						// if the binding is not set, we don't want to overwrite any parameters that are already there (e.g. the resolve field)
						if (self.field.enumerationOperationBinding[key] != null) {
							var target = parameters;
							var parts = key.split(".");
							for (var i = 0; i < parts.length - 1; i++) {
								if (!target[parts[i]]) {
									target[parts[i]] = {};
								}
								target = target[parts[i]];
							}
							if (self.field.enumerationOperationBinding[key].indexOf("record.") == 0) {
								target[parts[parts.length - 1]] = self.$services.page.getValue(self.parentValue, self.field.enumerationOperationBinding[key].substring("record.".length));
							}
							else {
								target[parts[parts.length - 1]] = self.$services.page.getBindingValue(pageInstance, self.field.enumerationOperationBinding[key], self);
							}
						}
					});
				}
				if (!parameters["$serviceContext"]) {
					parameters["$serviceContext"] = pageInstance.getServiceContext();
				}
				return this.$services.swagger.execute(this.field.enumerationOperation, parameters, function(response) {
					var result = null;
					if (response) {
						Object.keys(response).map(function(key) {
							if (response[key] instanceof Array) {
								result = response[key];
								if (self.field.selectFirstIfEmpty && self.value == null && result && result.length > 0) {
									self.$emit("input", self.enumerationExtracter(result[0]));
								}
							}
						});
					}
					return result ? result : [];
				});
			}
			else if (this.field.provider == "array") {
				if (this.field.enumerationArray) {
					var self = this;
					var pageInstance = self.$services.page.getPageInstance(self.page, self);
					var pageArray = pageInstance.get(this.field.enumerationArray);
					var array = [];
					if (pageArray && pageArray.length) {
						nabu.utils.arrays.merge(array, pageArray);
					}
					if (this.field.filter) {
						array = array.filter(function(x) {
							return self.$services.page.isCondition(self.field.filter, x, self);
						})
					}
						
					if (array && array.length) {
						
						if (this.field.addEmptyState == true && this.field.emptyState != null) {
							// create empty object
							var empty = {}
							if (this.field.enumerationArrayValue) {
								empty[this.field.enumerationArrayValue] = null;
								empty['emptyState'] = true;
							}
							
							var emptyInArray = array.filter(function(x) {
								return x.emptyState == true;	
							});
							if (emptyInArray != null && emptyInArray.length == 0) {
								array.push(empty);
							}
						}
						
						if (!value) {
							return array;
						}
						else {
							return array.filter(function(x) {
								if (self.field.enumerationArrayLabel != null) {
									var label = x[self.field.enumerationArrayLabel];
									if (label && label.toLowerCase && label.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
										return true;
									}
								}
								if (self.field.enumerationArrayValue != null) {
									var label = x[self.field.enumerationArrayValue];
									if (label && label.toLowerCase && label.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
										return true;
									}
								}
							});
						}
					}
				}
				return [];
			}
			else if (this.field.provider == "provider") {
				var provider = this.provider;
				if (provider) {
					var values = provider.enumerate();
					var self = this;
					if (value) {
						values = values.filter(function(x) {
							var formatted = self.enumerationFormatter(x);
							return formatted.toLowerCase().indexOf(value.toLowerCase()) >= 0;
						});
					}
					// the sorting can conflict with explicit sorting you want to manage from the outside
					// additionally, it can cause an infinite render loop
					/*
					values.sort(function(a, b) {
						var valueA = self.enumerationFormatter(a);
						var valueB = self.enumerationFormatter(b);
						return valueA ? valueA.localeCompare(valueB) : (valueB ? -1 : 0);
					});
					*/
					return values;
				}
				else {
					return [];
				}
			}
			else if (this.field.providers == "fixed") {
				var self = this;
				var result = this.field.enumerations.map(function(x) {
					if(typeof(x) == "string"){
						return "" + (x && x.indexOf("=") == 0 ? self.$services.page.interpret(x, self) : x);
					}
					else {
						x = nabu.utils.objects.clone(x);
						x.value = "" + (x && x.value && x.value.indexOf("=") == 0 ? self.$services.page.interpret(x.value, self) : x.value);
						return x;
					}
				}).filter(function(x) {
					if(typeof(x) == "string"){
						return !value || x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
					}
					else {
						return !value || x.value.toLowerCase().indexOf(value.toLowerCase()) >= 0;
					}
				});
				if (this.field.allowCustom && result.indexOf(value) < 0) {
					result.unshift(value);
				}
				return result;
			}
			return [];
		},
		enumerationResolver: function(value) {
			if (this.field.provider == "operation" && this.field.enumerationOperationResolve && this.field.enumerationFieldValue) {
				return this.enumerationFilterAny(value, true);
			}
			return value;
		},
		enumerationFormatter: function(value) {
			if (this.field.provider == "fixed") {
				if (typeof(value) == "string") {
					return value;
				}
				else if (value) {
					// probably not used because we already resolve interpretations in the enumerate (?)
					if (value.value) {
						return this.$services.page.interpret(this.$services.page.translate(value.value, this), this);
					}
					else {
						return value.key;
					}
				}
			}
			else {
				if (value == null) {
					return null;
				}
				else if (this.field.enumerationFieldLabelComplex) {
					var pageInstance = this.$services.page.getPageInstance(this.page, this);
					return !this.field.complexLabel ? this.field.complexLabel : this.$services.typography.replaceVariables(pageInstance, this.field, this.field.complexLabel, this.$services.q.reject(), value);
				}
				else if (this.field.enumerationFormatter) {
					return this.field.enumerationFormatter(value);
				}
				else if (this.field.enumerationFieldLabel) {
					return value[this.field.enumerationFieldLabel];
				}
				else {
					return value;
				}
			}
		},
		enumerationPrettyFormatter: function(value) {
			if (value == null) {
				return null;
			}
			if (value && value.emptyState == true && this.field.addEmptyState == true && !!this.field.emptyState) {
				return this.$services.page.interpret(this.$services.page.translate(this.field.emptyState), this);
			}
			else if (this.field.enumerationFieldPrettyLabelComplex) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				return !this.field.complexPrettyLabel ? this.field.complexPrettyLabel : this.$services.typography.replaceVariables(pageInstance, this.field, this.field.complexPrettyLabel, this.$services.q.reject(), value);
			}
			else if (this.field.enumerationFieldPrettyLabel) {
				return value[this.field.enumerationFieldPrettyLabel];
			}
			else {
				return this.enumerationFormatter(value);
			}
		},
		enumerationExtracter: function(value) {
			if (this.field.provider == "fixed") {
				if (typeof(value) == "string") {
					return value;
				}
				else if (value) {
					if (value.key) {
						return this.$services.page.interpret(value.key, this);
					}
					else {
						return value.value;
					}
				}
			}
			else {
				if (value == null) {
					return null;
				}
				else if (this.field.enumerationFieldValue) {
					return value[this.field.enumerationFieldValue];
				}
				else {
					return value;
				}
			}
		},
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		}
	}
})
Vue.component("enumeration-provider-configure", {
	template: "#enumeration-provider-configure",
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
		}
	},
	created: function() {
		if (!this.field.enumerationOperationBinding) {
			Vue.set(this.field, "enumerationOperationBinding", {});
		}
	},
	computed: {
		availableParameters: function() {
			return this.$services.page.getAvailableParameters(this.page, this.cell, true);
		}
	},
	methods: {
		getEnumerationServices: function(name) {
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
		getEnumerationFields: function(operationId) {
			var fields = [];
			if (this.$services.swagger.operations[operationId]) {
				var resolved = this.$services.swagger.resolve(this.$services.swagger.operations[operationId].responses["200"]);
				Object.keys(resolved.schema.properties).map(function(property) {
					if (resolved.schema.properties[property].type == "array") {
						nabu.utils.arrays.merge(fields, Object.keys(resolved.schema.properties[property].items.properties));
					}
				});
			}
			return fields;
		},
		getEnumerationParameters: function(operationId) {
			var parameters = this.$services.swagger.operations[operationId].parameters;
			return parameters ? parameters.map(function(x) { return x.name }) : [];
		},
		getMappableEnumerationParameters: function(field) {
			var result = {
				properties: {}
			};
			if (this.$services.swagger.operations[field.enumerationOperation]) {
				Object.keys(this.$services.page.getInputBindings(this.$services.swagger.operations[field.enumerationOperation])).map(function(key) {
					if (key != field.enumerationOperationQuery) {
						result.properties[key] = {
							type: "string"
						}
					}
				});
				result.properties["$serviceContext"] = {
					type: "string"
				}
			}
			return result;
		},
		hasMappableEnumerationParameters: function(field) {
			var amount = Object.keys(this.getMappableEnumerationParameters(field).properties).length;
			return amount > 0;
		},
		searchPossible: function(value) {
			return this.possibleFields.filter(function(x) {
				return !value || x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
			});
		},
		enumerationFilter: function(value) {
			var providers = nabu.page.providers("page-enumerate").map(function(x) { return x.name });
			if (value) {
				providers = providers.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			providers.sort();
			return providers;
		}
	}
})
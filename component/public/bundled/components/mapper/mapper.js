Vue.component("n-page-mapper", {
	template: "#n-page-mapper",
	props: {
		// every key is a new source to map from and contains the definitions of the fields we can map in there
		from: {
			type: Object,
			required: true
		},
		// contains the definitions of the fields we can map to
		to: {
			required: true
		},
		// the resulting bindings are in here
		value: {
			type: Object,
			required: true
		}
	},
	computed: {
		// for the label dropdown
		sources: function() {
			var sources = Object.keys(this.from);
			// allow fixed values
			sources.push("fixed");
			if (this.$services.page.transformers.length > 0) {
				sources.push("$transformer");
			}
			// allow enumerations
			nabu.utils.arrays.merge(sources, nabu.page.providers("page-enumerate").map(function(x) {
				return x.name;
			}));
			sources.sort();
			return sources;
		}
	},
	data: function() {
		return {
			fieldsToMap: []
		}
	},
	created: function() {
		if (this.to instanceof Array) {
			nabu.utils.arrays.merge(this.fieldsToMap, this.to);
		}
		else if (this.to) {
			nabu.utils.arrays.merge(this.fieldsToMap, this.$services.page.getSimpleKeysFor(this.to, true, true));
		}
	},
	methods: {
		// get the possible field names for this label
		fieldsFrom: function(value, label, fields) {
			if (label == "$transformer") {
				var transformers = this.$services.page.transformers.map(function(x) { return x.id });
				if (value) {
					transformers = transformers.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase() >= 0 )});
				}
				return transformers;
			}
			if (label == "fixed") {
				return value ? [value] : [];
			}
			var provider = nabu.page.providers("page-enumerate").filter(function(x) { return x.name == label })[0];
			if (provider) {
				var enumerations = provider.enumerate();
				if (provider.label) {
					enumerations = enumerations.map(function(x) { return x[provider.label ]});
				}
				return enumerations;
			}
			var fields = this.$services.page.getSimpleKeysFor(this.from[label], true, true);
			if (value) {
				fields = fields.filter(function(x) { x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			fields.push("$all");
			return fields;
		},
		getTransformerInput: function(id) {
			var transformer = this.$services.page.transformers.filter(function(x) { return x.id == id })[0];
			var parameters = {};
			var self = this;
			if (transformer) {
				transformer.inputs.map(function(x) {
					parameters[x.name] = self.$services.page.getResolvedPageParameterType(x.type);
				});
			}
			return {properties:parameters};
		},
		getTransformerOutput: function(id, value) {
			var transformer = this.$services.page.transformers.filter(function(x) { return x.id == id })[0];
			var parameters = {};
			var self = this;
			if (transformer) {
				transformer.outputs.map(function(x) {
					parameters[x.name] = self.$services.page.getResolvedPageParameterType(x.type);
				});
			}
			return this.$services.page.getSimpleKeysFor({properties:parameters}, true, true);
		},
		setValue: function(field, newValue, label) {
			if (false && label == "fixed" && newValue) {
				this.value[field] = {
					label: label,
					value: newValue
				};
			}
			else if (label == "$transformer" && newValue) {
				this.value[field] = {
					label: label,
					value: newValue,
					bindings: {},
					output: null
				};
			}
			else {
				this.value[field] = label && newValue ? label + '.' + newValue : null;
			}
		},
		getBindingsFor: function(field) {
			if (this.value[field] && this.value[field].bindings) {
				return this.value[field].bindings;
			}
			return null;
		},
		getObjectFor: function(field) {
			return this.value[field];
		},
		getValueFor: function(field) {
			if (this.value[field] && this.value[field].value) {
				return this.value[field].value;
			}
			return this.value[field]
				? this.value[field].substring(this.value[field].indexOf(".") + 1)
				: null;
		},
		getLabelFor: function(field) {
			// if we have an object
			if (this.value[field] && this.value[field].label) {
				return this.value[field].label;
			}
			return this.value[field]
				? this.value[field].split(".")[0]
				: null;
		}
	}
});

// allow complex formatting (e.g. multiple fields etc)
// can also allow complex extraction, though unlikely necessary

Vue.component("page-form-input-enumeration-provider-configure", {
	template: "<n-form-combo v-model='field.enumerationProvider' :filter='enumerationFilter' label='Enumeration Provider'/>",
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
	created: function() {
		if (!this.field.enumerationProvider) {
			Vue.set(this.field, "enumerationProvider", null);
		}
	},
	methods: {
		enumerationFilter: function(value) {
			var providers = nabu.page.providers("page-enumerate").map(function(x) { return x.name });
			if (value) {
				providers = providers.filter(function(x) { return x.toLowerCase().indeOf(value.toLowerCase()) >= 0 });
			}
			providers.sort();
			return providers;
		}
	}
});

Vue.component("page-form-input-enumeration-provider", {
	template: "<n-form-combo :filter='enumerationFilter' :formatter='enumerationFormatter' :extracter='enumerationExtracter'"
			+ "		@input=\"function(newValue) { $emit('input', newValue) }\""
			+ "		:timeout='600'"
			+ "		:label='label'"
			+ "		:value='value'"
			+ "		:schema='schema'"
			+ "		:disabled='disabled'/>",
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
			provider: null
		}
	},
	methods: {
		// enumerationOperation: null,
		// enumerationFormatter
		// enumerationOperationLabel: null,
		// enumerationOperationValue: null,
		// enumerationOperationQuery: null,
		// enumerationOperationBinding: {}
		enumerationFilter: function(value) {
			var parameters = {};
			if (this.field.enumerationOperationQuery) {
				parameters[this.field.enumerationOperationQuery] = value;
			}
			// map any additional bindings
			if (this.field.enumerationOperationBinding) {
				var self = this;
				var pageInstance = this.$services.page.instances[this.page.name];
				Object.keys(this.field.enumerationOperationBinding).map(function(key) {
					var target = parameters;
					var parts = key.split(".");
					for (var i = 0; i < parts.length - 1; i++) {
						if (!target[parts[i]]) {
							target[parts[i]] = {};
						}
						target = target[parts[i]];
					}
					target[parts[parts.length - 1]] = pageInstance.get(self.field.enumerationOperationBinding[key]);
				});
			}
			return this.$services.swagger.execute(this.field.enumerationOperation, parameters, function(response) {
				var result = null;
				if (response) {
					Object.keys(response).map(function(key) {
						if (response[key] instanceof Array) {
							result = response[key];
						}
					});
				}
				return result ? result : [];
			});
		},
		enumerationFormatter: function(value) {
			if (value == null) {
				return null;
			}
			else if (this.field.enumerationFormatter) {
				return this.field.enumerationFormatter(value);
			}
			else if (this.field.enumerationOperationLabel) {
				return value[this.field.enumerationOperationLabel];
			}
			else {
				return value;
			}
		},
		enumerationExtracter: function(value) {
			if (value == null) {
				return null;
			}
			else if (this.field.enumerationOperationValue) {
				return value[this.field.enumerationOperationValue];
			}
			else {
				return value;
			}
		}
	}
});


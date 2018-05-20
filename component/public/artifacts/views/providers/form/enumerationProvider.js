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
	created: function() {
		if (this.field.enumerationProvider) {
			var self = this;
			this.provider = nabu.page.providers("page-enumerate").filter(function(x) { return x.name == self.field.enumerationProvider })[0];
		}
	},
	methods: {
		enumerationFilter: function(value) {
			if (this.provider) {
				var values = this.provider.enumerate();
				var self = this;
				if (value) {
					values = values.filter(function(x) {
						var formatted = self.enumerationFormatter(x);
						return formatted.toLowerCase().indexOf(value.toLowerCase()) >= 0;
					});
				}
				values.sort(function(a, b) {
					var valueA = self.enumerationFormatter(a);
					var valueB = self.enumerationFormatter(b);
					return valueA ? valueA.localeCompare(valueB) : (valueB ? -1 : 0);
				});
				return values;
			}
		},
		enumerationFormatter: function(value) {
			if (value && this.provider && this.provider.label) {
				return value[this.provider.label];
			}
			return value;
		},
		enumerationExtracter: function(value) {
			if (value && this.provider && this.provider.value) {
				return value[this.provider.value];
			}
			return value;
		}
	}
});
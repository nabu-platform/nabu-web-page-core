Vue.component("page-form-input-enumeration-provider-configure", {
	template: "<n-form-section><n-form-combo v-model='field.enumerationProvider' :filter='enumerationFilter' label='Enumeration Provider'/>"
		+ "	<n-form-combo v-if='valueOptions'  :items='valueOptions' v-model='field.enumerationProviderValue' label='Value Field'/>"
		+ "</n-form-section>",
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
	computed: {
		valueOptions: function() {
			if (this.field.enumerationProvider != null) {
				var self = this;
				var providers = nabu.page.providers("page-enumerate").map(function(x) { return x.name });
				var provider = nabu.page.providers("page-enumerate").filter(function(x) { return x.name == self.field.enumerationProvider })[0];
				console.log("for provider", provider);
				if (provider && provider.values) {
					return provider.values;
				}
			}
			return null;
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
	template: "<n-form-combo ref='form' :filter='enumerationFilter' :formatter='enumerationFormatter' :extracter='enumerationExtracter'"
			+ "		:edit='!readOnly'"
			+ "		:placeholder='placeholder'"
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
		},
		readOnly: {
			type: Boolean,
			required: false
		},
		placeholder: {
			type: String,
			required: false
		}
	},
	data: function() {
		return {
			provider: null
		}
	},
	created: function() {
		this.provider = this.getProvider();
	},
	methods: {
		getProvider: function() {
			if (this.field.enumerationProvider) {
				var self = this;
				return nabu.page.providers("page-enumerate").filter(function(x) { return x.name == self.field.enumerationProvider })[0];
			}
			return null;
		},
		enumerationFilter: function(value) {
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
				values.sort(function(a, b) {
					var valueA = self.enumerationFormatter(a);
					var valueB = self.enumerationFormatter(b);
					return valueA ? valueA.localeCompare(valueB) : (valueB ? -1 : 0);
				});
				return values;
			}
			else {
				return [];
			}
		},
		enumerationFormatter: function(value) {
			var provider = this.provider;
			if (value && provider && provider.label) {
				return value[provider.label];
			}
			return value;
		},
		enumerationExtracter: function(value) {
			var provider = this.provider;
			if (this.field.enumerationOperationValue) {
				return value[this.field.enumerationOperationValue];
			}
			else if (value && provider && provider.value) {
				return value[provider.value];
			}
			return value;
		},
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		}
	}
});
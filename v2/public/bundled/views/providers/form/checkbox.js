Vue.component("page-form-input-checkbox-configure", {
	template: "<div><n-form-switch v-model='field.mustCheck' label='Must Check'/>"
			+ "	<n-form-text v-model='field.info' label='Info Content'/>" 
			+ "	<n-form-switch v-model='field.invert' label='Invert Boolean'/>" 
			+ "	<n-form-text v-model='field.infoIcon' label='Info Icon'/>"
			+ "	<n-page-mapper v-model='field.bindings' :from='availableParameters' :to='[\"item\"]'/>"
			+ "</div>",
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
		if (!this.field.bindings) {
			Vue.set(this.field, "bindings", {});
		}
	},
	computed: {
		availableParameters: function() {
			return this.$services.page.getAvailableParameters(this.page, this.cell, true);
		}
	}
});

Vue.component("page-form-input-checkbox", {
	template: "<n-form-checkbox ref='form'"
			+ "		:edit='!readOnly'"
			+ "		:schema='schema'"
			+ "		:info-icon='field.infoIcon'"
			+ "		:info='$services.page.translate(field.info)'"
			+ "		:must-check='field.mustCheck'"
			+ "		@input=\"function(newValue) { $emit('input', newValue) }\""
			+ "		:label='label'"
			+ "		:item='getItem()'"
			+ "		:value='value'"
			+ "		:timeout='timeout'"
			+ "		:invert='!!field.invert'"
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
		}
	},
	methods: {
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		},
		getItem: function() {
			if (this.field.bindings && this.field.bindings.item) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				return this.$services.page.getBindingValue(pageInstance, this.field.bindings.item, this);
			}
		}
	}
});
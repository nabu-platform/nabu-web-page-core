Vue.component("page-form-input-text-configure", {
	template: "<n-form-section><n-form-combo v-model='field.textType' label='Text Type' :items=\"['text', 'area', 'number', 'color', 'email', 'password']\"/>"
		+ "	<n-form-text v-model='field.regexLabel' label='Regex Label'/>"
		+ "	<n-form-text v-model='field.maxLength' label='Max Length'/>"
		+ "	<n-form-switch v-model='field.showLength' label='Show Length' v-if='field.maxLength'/>"
		+ "	<n-form-combo v-model='field.required' label='Required' :items=\"[true,false]\" />"
		+ "	<n-form-text v-model='field.info' label='Info Content'/>"
		+ "	<n-form-text v-model='field.before' label='Before Content'/>"
		+ "	<n-form-text v-model='field.beforeIcon' label='Before Icon' v-if='field.before'/>"
		+ "	<n-form-text v-model='field.after' label='After Content'/>"
		+ "	<n-form-text v-model='field.afterIcon' label='After Icon' v-if='field.after'/>"
		+ "	<n-form-text v-model='field.suffix' label='Suffix' v-if='!field.suffixIcon'/>"
		+ "	<n-form-text v-model='field.suffixIcon' label='Suffix Icon' v-if='!field.suffix'/>"
		+ "	<n-page-mapper v-model='field.bindings' :from='availableParameters' :to='[\"validator\"]'/>"
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
		if (!this.field.textType) {
			Vue.set(this.field, "textType", null);
		}
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

Vue.component("page-form-input-text", {
	template: "<n-form-text :type='textType' ref='form'"
			+ "		:class=\"{'has-suffix-icon': !!field.suffixIcon, 'has-suffix': !!field.suffix }\""
			+ "		:edit='!readOnly'"
			+ "		:placeholder='placeholder'"
			+ "		:max-length='field.maxLength ? field.maxLength : null'"
			+ "		:schema='schema'"
			+ "		:pattern-comment='field.regexLabel ? $services.page.translate(field.regexLabel) : null'"
			+ "		@input=\"function(newValue) { $emit('input', newValue) }\""
			+ "		:label='label'"
			+ "		:value='value'"
			+ "		:required='field.required'"
			+ "		:validator='getValidator()'"
			+ "		:info='field.info ? $services.page.translate(field.info) : null'"
			+ "		:before='field.before ? $services.page.translate(field.before) : null'"
			+ "		:after='field.after ? $services.page.translate(field.after) : null'"
			+ "		:suffix='field.suffixIcon ? $services.page.getIconHtml(field.suffixIcon) : field.suffix'"
			+ "		:name='field.name'"
			+ "		:timeout='timeout'"
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
	computed: {
		textType: function() {
			return this.field.textType ? this.field.textType : 'text';
		}
	},
	methods: {
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		},
		getValidator: function() {
			if (this.field.bindings && this.field.bindings.validator) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				return this.$services.page.getBindingValue(pageInstance, this.field.bindings.validator, this);
			}
		}
	}
}); 




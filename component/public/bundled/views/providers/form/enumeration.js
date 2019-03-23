Vue.component("page-form-input-enumeration-configure", {
	template: "<n-form-section><n-form-switch v-model='field.allowCustom' label='Allow Custom Values'/><button @click=\"field.enumerations.push('')\">Add enumeration</button>"
		+ "		<n-form-section class='enumeration list-row' v-for='i in Object.keys(field.enumerations)' :key=\"field.name + 'enumeration_' + i\">"
		+ "			<n-form-text v-model='field.enumerations[i]'/>"
		+ "			<button @click='field.enumerations.splice(i, 1)'><span class='fa fa-trash'></span></button>"
		+ "		</n-form-section></n-form-section>",
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
		if (!this.field.enumerations) {
			Vue.set(this.field, "enumerations", []);
		}
	}
});

Vue.component("page-form-input-enumeration", {
	template: "<n-form-combo :filter='enumerate' ref='form'"
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
	methods: {
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		},
		enumerate: function(value) {
			var result = this.field.enumerations.filter(function(x) {
				return !value || x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
			});
			if (this.field.allowCustom && result.indexOf(value) < 0) {
				result.unshift(value);
			}
			return result;
		}
	}
});
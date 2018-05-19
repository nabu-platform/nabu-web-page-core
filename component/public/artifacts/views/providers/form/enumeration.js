Vue.component("page-form-input-enumeration-configure", {
	template: "<n-form-section><button @click=\"field.enumerations.push('')\">Add enumeration</button>"
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
	template: "<n-form-combo :items='field.enumerations'"
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
	}
});
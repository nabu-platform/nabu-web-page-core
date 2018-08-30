Vue.component("page-form-input-date-configure", {
	template: "<n-form-section>"
		+ "	<n-form-switch v-model='field.includeHours' label='%{Include hours?}'/>"
		+ "	<n-form-switch v-model='field.includeMinutes' label='%{Include minutes?}' v-if='field.includeHours'/>"
		+ "	<n-form-switch v-model='field.includeSeconds' label='%{Include seconds?}' v-if='field.includeHours && field.includeMinutes'/>"
		+ "	<n-form-switch v-model='field.isTimestamp' label='%{Is a timestamp in milliseconds?}' v-if='!field.isSecondsTimestamp'/>"
		+ "	<n-form-switch v-model='field.isSecondsTimestamp' label='%{Is a timestamp in seconds?}' v-if='!field.isTimestamp'/>"
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
	}
});

Vue.component("page-form-input-date", {
	template: "<n-form-date ref='form'"
			+ "		:schema='schema'"
			+ "		@input=\"function(newValue) { $emit('input', newValue) }\""
			+ "		:label='label'"
			+ "		:value='value'"
			+ "		:timeout='timeout'"
			+ "		:include-hours='field.includeHours'"
			+ "		:include-minutes='field.includeHours && field.includeMinutes'"
			+ "		:include-seconds='field.includeHours && field.includeMinutes && field.includeSeconds'"
			+ "		:timestamp='field.isTimestamp'"
			+ "		:seconds-timestamp='field.isSecondsTimestamp'"
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
	methods: {
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		}
	}
});
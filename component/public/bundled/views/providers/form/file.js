Vue.component("page-form-input-file-configure", {
	template: "<n-form-section>"
		+ "	<n-form-section v-for='i in Object.keys(field.fileTypes)' class='list-row'>"
		+ "		<n-form-text v-model='field.fileTypes[i]'/>"
		+ "		<button @click='field.fileTypes.splice(i)'><span class='fa fa-trash'></span></button>"
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
		if (!this.field.fileTypes) {
			Vue.set(this.field, "fileTypes", []);
		}
	}
});

Vue.component("page-form-input-file", {
	template: "<n-input-file :types='field.fileTypes' ref='form' :amount='1'"
			+ "		:schema='schema'"
			+ "		@change=\"function(newValue) { $emit('input', newValue && newValue.length ? newValue[0] : null) }\""
			+ "		:label='label'"
			+ "		:value='files'"
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
		}
	},
	data: function() {
		return {
			files: []
		}
	},
	computed: {
		textType: function() {
			return this.field.textType ? this.field.textType : 'text';
		}
	},
	methods: {
		validate: function(soft) {
			var messages = [];
			var mandatory = nabu.utils.vue.form.mandatory(this);
			if (mandatory && files.length < 1) {
				messages.push({
					soft: true,
					severity: "error",
					code: "required",
					title: "%{validation:The value is required}",
					priority: 0,
					values: {
						actual: false,
						expected: true
					},
					context: []
				});
			}
			return messages;
		}
	}
});
Vue.component("page-form-list-input-dynamic-configure", {
	template: "<div/>",
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

Vue.component("page-form-list-input-dynamic", {
	template: "<n-form-section ref='form'>"
					+ "		<button @click='addInstanceOfField'>%{Add} {{field.label ? field.label : field.name}}</button>"
					+ "		<n-form-section v-if='result[field.name]'>"
					+ "			<n-form-section v-for='i in Object.keys(result[field.name])' :key=\"field.name + '_wrapper' + i\">"
					+ "				<n-form-section v-if='isSimpleList()'>"
					+ "					<page-form-field :key=\"field.name + '_value' + i + '_' + key\" :field='field'"
					+ "						v-model='result[field.name][i]'"
					+ "						:schema='getSchemaFor()'"
					+ "						@input=\"$emit('changed')\""
					+ "						:timeout='timeout'"
					+ "						:page='page'"
					+ "						:cell='cell'/>"
					+ "				</n-form-section><n-form-section v-else>"
					+ "					<n-form-section v-for='key in Object.keys(result[field.name][i])' :key=\"field.name + '_wrapper' + i + '_wrapper'\""
					+ "						v-if=\"getField(field.name + '.' + key)\">"
					+ "					<page-form-field :key=\"field.name + '_value' + i + '_' + key\" :field=\"getField(field.name + '.' + key)\"" 
					+ "						:schema=\"getSchemaFor(field.name + '.' + key)\" v-model='result[field.name][i][key]'"
					+ "						@input=\"$emit('changed')\""
					+ "						:timeout='timeout'"
					+ "						:page='page'"
					+ "						:cell='cell'/>"
					+ "			</n-form-section></n-form-section>"
					+ "		<button @click='result[field.name].splice(i, 1)'>%{Remove} {{field.label ? field.label : field.name}}</button>"
					+ "	</n-form-section>"
					+ "</n-form-section>"
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
		},
		addInstanceOfField: function() {
			var field = this.field;
			if (!this.result[field.name]) {
				Vue.set(this.result, field.name, []);
			}
			var schema = this.getSchemaFor(field.name);
			if (schema.items) {
				schema = schema.items;
			}
			var result = null;
			if (schema.properties) {
				result = {};
				Object.keys(schema.properties).map(function(key) {
					result[key] = null;
				});
			}
			this.result[field.name].push(result);
		},
		isSimpleList: function() {
			// if the items consist of properties, they are complex, otherwise they are simple
			return !!this.schema.items.properties;	
		},
		getSchemaFor: function(key) {
			// we want a single field in a complex list
			if (key) {
				return this.schema.items.properties[key];
			}
			// we are using a simple list (e.g. strings)
			else {
				return this.schema.items;
			}
		}
	}
});
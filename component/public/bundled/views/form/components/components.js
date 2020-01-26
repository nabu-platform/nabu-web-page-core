Vue.view("form-text", {
	category: "Form",
	name: "Text",
	description: "An input field for plain text",
	icon: "page/core/images/form-text.svg",
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		}
	},
	data: function() {
		return {
			configuring: false
		}
	},
	methods: {
		configure: function() {
			this.configuring = true;
		},
		getPageInstance: function() {
			return this.$services.page.getPageInstance(this.page, this);	
		},
		getSchema: function() {
			if (!this.cell.state.name) {
				return null;
			}
			var recursiveGet = function(schema, parts, index) {
				if (schema.items) {
					schema = schema.items;
				}
				var properties = schema.properties;
				if (properties && properties[parts[index]]) {
					if (index < parts.length - 1) {
						return recursiveGet(properties[parts[index]], parts, index + 1);
					}
					else {
						var result = properties[parts[index]];
						result.required = result.required || schema.required && schema.required.indexOf(parts[index]) >= 0;
						return result;
					}
				}
			}
			var definition = this.$services.page.getPageParameters(this.page);
			var parts = this.cell.state.name.split(".");
			return definition ? recursiveGet(definition, parts, 0) : null;
		},
		availableFields: function(value) {
			var fields = [];
			var parameters = this.$services.page.getPageParameters(this.page);
			nabu.utils.arrays.merge(fields, this.$services.page.getSimpleKeysFor(parameters, true, true));
			console.log("fields are", fields);
			fields.sort();
			if (value) {
				fields = fields.filter(function(x) {
					return x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				});
			}
			return fields;
		},
		update: function(value) {
			this.getPageInstance().set(this.cell.state.name, value);
		}
	}
})
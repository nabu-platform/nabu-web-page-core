if (!nabu) { var nabu = {} };
if (!nabu.page) { nabu.page = {} };
if (!nabu.page.views) { nabu.page.views = {} };

nabu.page.views.FormComponentGenerator = function(name) {
	return Vue.component(name, {
		template: "#" + name,
		props: {
			page: {
				type: Object,
				required: true
			},
			cell: {
				type: Object,
				required: true
			},
			childComponents: {
				type: Object,
				required: false
			},
			formComponent: {
				type: String,
				required: false,
				default: "page-form-input-text"
			},
			configurationComponent: {
				type: String,
				required: false,
				default: "page-form-input-text-configure"
			},
			edit: {
				type: Boolean
			}
		},
		computed: {
			// not reactively updated it seems?
			pageInstance: function() {
				return this.$services.page.getPageInstance(this.page, this);
			},
			value: function() {
				var instance = this.pageInstance;
				return instance && this.cell.state.name ? instance.get('page.' + this.cell.state.name) : null;
			},
			parentValue: function() {
				var instance = this.pageInstance;
				return instance ? instance.variables : null;
			},
			disabled: function() {
				var pageInstance = this.pageInstance;
				if (!pageInstance) {
					 return true;
				}
				var state = this.$services.page.getPageState(pageInstance);
				return !!this.cell.state.disabled && this.$services.page.isCondition(this.cell.state.disabled, state, this);
			}
		},
		methods: {
			getChildComponents: function() {
				var result = [];
				if (this.$refs.input && this.$refs.input.getChildComponents) {
					nabu.utils.arrays.merge(result, this.$refs.input.getChildComponents());
				}
				if (result.length == 0) {
					result.push({
						title: "Form Component",
						name: "form-component",
						component: "form-component"
					});
				}
				return result;
			},
			configurator: function() {
				return "nabu-form-component-configuration";	
			},
			getPageInstance: function() {
				var instance =  this.$services.page.getPageInstance(this.page, this);
				//console.log("resolving cell state", this.cell.state.name, instance, instance.get("page." + this.cell.state.name));
				return this.$services.page.getPageInstance(this.page, this);	
			},
			isDisabled: function() {
				var self = this;
				var pageInstance = self.$services.page.getPageInstance(this.page, this);
				var state = self.$services.page.getPageState(pageInstance);
				return !!this.cell.state.disabled && this.$services.page.isCondition(this.cell.state.disabled, state, this);
			},
			getSchema: function() {
				if (!this.edit && this.schemaResolved) {
					return this.schema;
				}
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
				var result = definition ? recursiveGet(definition, parts, 0) : null;
				if (!this.edit) {
					this.schema = result;
					// make sure we know its resolved, even if it's null
					this.schemaResolved = true;
				}
				return result;
			},
			availableFields: function(value) {
				var fields = [];
				var parameters = this.$services.page.getPageParameters(this.page);
				nabu.utils.arrays.merge(fields, this.$services.page.getSimpleKeysFor(parameters, true, true));
				//console.log("fields are", fields);
				fields.sort();
				if (value) {
					fields = fields.filter(function(x) {
						return x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
					});
				}
				return fields;
			},
			update: function(value, label) {
				this.getPageInstance().set("page." + this.cell.state.name, value, label);
			},
			validate: function () {
				if (this.$refs && this.$refs.input) {
					return this.$refs.input.validate();
				}
			},
			blur: function() {
				if (this.cell.state.validateOnBlur) {
					this.validate();
				}
			}
		}
	})
};

nabu.page.views.FormComponent = nabu.page.views.FormComponentGenerator("nabu-form-component");
nabu.page.views.FormComponentGenerator("nabu-form-component-configuration");



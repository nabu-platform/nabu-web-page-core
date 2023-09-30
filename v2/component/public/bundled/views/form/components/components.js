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
			computedValue: function() {
				var instance = this.pageInstance;
				return this.cell.state.useComputed && this.cell.state.computed ? this.$services.page.eval(this.cell.state.computed, {}, this) : null;
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
				if (this.running) {
					return true;
				}
				var pageInstance = this.pageInstance;
				if (!pageInstance) {
					 return true;
				}
				var state = this.$services.page.getPageState(pageInstance);
				return !!this.cell.state.disabled && this.$services.page.isCondition(this.cell.state.disabled, state, this);
			}
		},
		created: function() {
			// if we have a raw value capture, we want to unset it when rendering this component
			// it can only be validly set by the component after it receives the actual value (if any)
			if (this.cell.state.rawName) {
				this.getPageInstance().set("page." + this.cell.state.rawName, null);
			}
			if (this.cell.state.readOnly) {
				this.editable = false;
			}
		},
		// for some reason enumeration (and all derivatives of enumeration) did not get destroyed correctly
		// if you remove the alias for example for form-text, the destroy is called correctly at all levels
		// same for all other tested form components (date, checkbox,...)
		// but with enumeration, the inner page-form-enumeration destroy was correctly called, but the outer destroy in this component was NOT called
		// this left a remaining instance of the component registered in the page at position 0, which made editing impossible until you fully destroyed and recreated the page
		// after various tests it is entirely unclear why the destroy does not correctly cascade in the case of enumerations so we subscribe to that destroy and cascade it here if relevant
		ready: function() {
			var self = this;
			this.$refs.input.$on("hook:beforeDestroy", function() {
				self.$destroy();
			});
		},
		data: function() {
			return {
				running: false,
				editable: true
			}
		},
		methods: {
			getEvents: function() {
				return this.$services.triggerable.getEvents(this.page, this.cell.state);
			},
			isRequired: function() {
				if (this.cell.state.required == "condition") {
					return this.$services.page.isCondition(this.cell.state.requiredCondition, {}, this);
				}
				else {
					return this.cell.state.required;
				}
			},
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
				return instance;	
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
			update: function(value, label, rawValue) {
				this.getPageInstance().set("page." + this.cell.state.name, value, label);
				if (this.cell.state.rawName) {
					this.getPageInstance().set("page." + this.cell.state.rawName, rawValue != null ? rawValue : value, label);
				}
				var self = this;
				// because going this route actually disables the component while it is performing the update, it will remove focus
				// if used in combination with say a text field, you probably want to set a timeout on the text field
				if (self.cell.state.triggers && self.cell.state.triggers.length > 0) {
					this.running = true;
					var done = function() {
						self.running = false;
					};
					// because the value might not have existed before, we need to give vue time to propagate the vue.set to everywhere
					// we had a race condition where often the update would trigger a form submit that would in turn trigger a validate
					// this validate failed because from that components perspective, the value had not yet arrived
					// if we incrementally increased a timeout to allow for propagation, the amount of failures went down
					Vue.nextTick(function() {
						// even waiting for the next tick is not enough to guarantee availability of data, but breaking out of that seems to do the trick...
						setTimeout(function() {
							self.$services.triggerable.trigger(self.cell.state, "update", {value:value, rawValue: rawValue}, self).then(done, done);
							// emit it so parent components (like repeat) can take action
							// we don't want to use the standard "input" to avoid accidental conflicts
							self.$emit("update", value, label, self.cell.state.name);
						}, 1);
					})
				}
				// when combined with triggers, it waits until the triggers are done
				// without triggers, we emit immediately
				else {
					self.$emit("update", value, label, self.cell.state.name);
				}
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




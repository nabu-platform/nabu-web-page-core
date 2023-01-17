Vue.view("nabu-form-dynamic-component", {
	mixins: [Vue.component("data-mixin")],
	data: function() {
		return {
			
		}
	},
	computed: {
		// the field we get the type from in the record
		typeField: function() {
			// TODO: allow configuration of this field
			return "type";
		},
		// the field we get the name from in the record
		nameField: function() {
			return "key";
		},
		labelField: function() {
			return "label";
		},
		// the field we write the key to
		targetKeyField: function() {
			return "key";
		},
		// the field we write the value to
		targetValueField: function() {
			return "value";
		},
		parentValue: function() {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			return pageInstance && this.cell.state.name ? pageInstance.get('page.' + this.cell.state.name) : null;
		}
	},
	methods: {
		configurator: function() {
			return "nabu-form-dynamic-component-configure";
		},
		// the label to display, you can translate it but it won't get automatically picked up in translation engine
		getLabelFor: function(record) {
			var label = this.labelField;
			if (label == null) {
				label = this.nameField;
			}
			return this.$services.page.translate(record[label]);
		},
		getComponentFor: function(record) {
			var type = record[this.typeField];
			var name = record[this.nameField];
			// TODO: allow custom mapping of data types
			if (type == "boolean") {
				return "page-form-checkbox";
			}
			else if (type == "date") {
				return "page-form-date";
			}
			else if (type == "string" && name && name.toLowerCase().indexOf("password") >= 0) {
				return "page-form-password";
			}
			else {
				return "page-form-text";
			}
		},
		getTargetFor: function(record) {
			var name = record[this.nameField];
			var parentValue = this.parentValue;
			// want reactivity (?)
			if (parentValue == null) {
				parentValue = [];
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				pageInstance.set("page." + this.cell.state.name, parentValue);
			}
			var current = parentValue.filter(function(x) {
				return x[self.targetKeyField] == name;
			})[0];
			if (current == null) {
				current = {};
				current[this.targetKeyField] = name;
				current[this.targetValueField] = null;
				parentValue.push(current);
			}
			return current;
		},
		getValueFor: function(record) {
			var target = this.getTargetFor(record);
			return target[this.targetValueField];
		},
		update: function(record, value, label) {
			var target = this.getTargetFor(record);
			target[this.targetValueField] = value;
		},
		getParentValue: function() {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			return pageInstance ? pageInstance.variables : null;
		}
	}
})

Vue.component("nabu-form-dynamic-component-configure", {
	template: "#nabu-form-dynamic-component-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	methods: {
		availableFields: function(value) {
			var parameters = this.$services.page.getAllArrays(this.page);
			parameters.sort();
			if (value) {
				parameters = parameters.filter(function(x) {
					return x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				});
			}
			return parameters;
		}
	}
})
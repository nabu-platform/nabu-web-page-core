if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

nabu.page.views.PageFieldsEdit = Vue.component("page-fields-edit", {
	template: "#page-fields-edit",
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		},
		allowMultiple: {
			type: Boolean,
			required: false,
			default: true
		},
		keys: {
			type: Array,
			required: false
		},
		allowForm: {
			type: Boolean,
			required: false,
			default: false
		},
		localState: {
			type: Object,
			required: false
		}
	},
	created: function() {
		if (!this.cell.state.fields) {
			Vue.set(this.cell.state, "fields", []);
		}
		if (!this.allowMultiple && !this.cell.state.fields.length) {
			this.addField();
		}
		this.normalize();
	},
	computed: {
		fragmentTypes: function() {
			var types = ['data', 'text', 'area', 'richtext'];
			if (this.allowForm) {
				types.push("form");
			}
			return types;
		}
	},
	methods: {
		normalize: function() {
			this.cell.state.fields.map(function(field) {
				if (!field.label) {
					Vue.set(field, "label", null);
				}
				if (!field.fragments) {
					Vue.set(field, "fragments", []);
				}
				if (!field.styles) {
					Vue.set(field, "styles", []);
				}
				field.fragments.map(function(fragment) {
					if (!fragment.type) {
						Vue.set(fragment, "type", "data");
					}
					if (!fragment.content) {
						Vue.set(fragment, "content", null);
					}
					if (!fragment.format) {
						Vue.set(fragment, "format", null);
					}
					if (!fragment.javascript) {
						Vue.set(fragment, "javascript", null);
					}
					if (!fragment.template) {
						Vue.set(fragment, "template", null);
					}
					if (!fragment.class) {
						Vue.set(fragment, "class", null);
					}
					if (!fragment.key) {
						Vue.set(fragment, "key", null);
					}
					if (!fragment.form) {
						Vue.set(fragment, "form", {});
					}
				});
			});
		},
		addStyle: function(field) {
			field.styles.push({
				class: null,
				condition: null
			});
		},
		fieldUp: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index > 0) {
				var replacement = this.cell.state.fields[index - 1];
				this.cell.state.fields.splice(index - 1, 1, field);
				this.cell.state.fields.splice(index, 1, replacement);
			}
		},
		fieldDown: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index < this.cell.state.fields.length - 1) {
				var replacement = this.cell.state.fields[index + 1];
				this.cell.state.fields.splice(index + 1, 1, field);
				this.cell.state.fields.splice(index, 1, replacement);
			}
		},
		up: function(field, fragment) {
			var index = field.fragments.indexOf(fragment);
			if (index > 0) {
				var replacement = field.fragments[index - 1];
				field.fragments.splice(index - 1, 1, fragment);
				field.fragments.splice(index, 1, replacement);
			}
		},
		down: function(field, fragment) {
			var index = field.fragments.indexOf(fragment);
			if (index < field.fragments.length - 1) {
				var replacement = field.fragments[index + 1];
				field.fragments.splice(index + 1, 1, fragment);
				field.fragments.splice(index, 1, replacement);
			}
		},
		addField: function() {
			this.cell.state.fields.push({
				label: null,
				fragments: [],
				styles: []
			});
			// already add a fragment, a field is generally useless without it...
			this.addFragment(this.cell.state.fields[this.cell.state.fields.length - 1]);
		},
		addFragment: function(field) {
			// default to a data fragment (generally the case)
			field.fragments.push({
				type: "data",
				content: null,
				format: null,
				javascript: null,
				template: null,
				class: null,
				key: null,
				disabled: null,
				hidden: null,
				form: {}
			});
		},
		getKeys: function(value) {
			// you can provide external keys
			if (this.keys) {
				return this.keys;
			}
			// otherwise we just try to get the default ones available to you
			var parameters = this.$services.page.getAvailableParameters(this.page, this.cell);
			console.log("parameters are", parameters, this.localState);
			var keys = this.$services.page.getSimpleKeysFor({properties:parameters});
			return value ? keys.filter(function(x) { x.toLowerCase().indexOf(value.toLowerCase()) >= 0 }) : keys;
		}
	}
});

nabu.page.views.PageFields = Vue.component("page-fields", {
	template: "#page-fields",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
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
		},
		data: {
			required: false
		},
		style: {
			type: Boolean,
			required: false
		},
		label: {
			type: Boolean,
			required: false,
			default: true
		},
		localState: {
			type: Object,
			required: false
		}
	},
	data: function() {
		return {
			configuring: false
		}
	},
	created: function() {
		this.normalize(this.cell.state);
	},
	methods: {
		configure: function() {
			this.configuring = true;	
		},
		normalize: function(state) {
			if (!state.class) {
				Vue.set(state, "class", null);
			}
		}
	}
});

Vue.component("page-field", {
	template: "#page-field",
	props: {
		data: {
			type: Object,
			required: true
		},
		field: {
			type: Object,
			required: true
		},
		style: {
			type: Boolean,
			required: false,
			default: true
		},
		label: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	methods: {
		getDynamicClasses: function(field) {
			var classes = null;
			if (this.style) {
				classes = this.$services.page.getDynamicClasses(field.styles, this.data);
			}
			else {
				classes = [];
			}
			if (this.label) {
				classes.push("with-label");
			}
			return classes;
		},
		isHidden: function(fragment) {
			if (fragment.hidden) {
				return this.$services.page.isCondition(fragment.hidden, {record:this.data}); 
			}
			return false;
		},
		format: function(fragment) {
			if (fragment.key) {
				var parts = fragment.key.split(".");
				var value = this.data;
				parts.map(function(part) {
					if (value) {
						value = value[part];
					}
				});
				if (value) {
					var format = fragment.format;
					if (format == "link") {
						if (value.indexOf("http://") == 0 || value.indexOf("https://") == 0) {
							return "<a target='_blank' href='" + value + "'>" + value.replace(/http[s]*:\/\/([^/]+).*/, "$1") + "</a>";
						}
					}
					else if (format == "dateTime") {
						value = new Date(value).toLocaleString();
					}
					else if (format == "date") {
						value = new Date(value).toLocaleDateString();
					}
					else if (format == "time") {
						value = new Date(value).toLocaleTimeString();
					}
					else if (format == "masterdata") {
						value = this.$services.masterdata.resolve(value);
					}
					else if (format == "javascript") {
						value = this.formatJavascript(fragment.key, value, this.data);
					}
					else if (typeof(value) == "string") {
						value = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
							.replace(/\n/g, "<br/>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
					}
				}
				return value;
			}
		},
		formValue: function(fragment) {
			if (fragment.form.name) {
				return this.data[fragment.form.name];
			}
		},
		updateForm: function(fragment, newValue) {
			Vue.set(this.data, fragment.form.name, newValue);
			this.$emit("updated", fragment.form.name);
		}
	},
	formatJavascript: function(fragment, key, value, data) {
		if (fragment.javascript) {
			try {
				var result = eval(fragment.javascript);
				if (result instanceof Function) {
					result = result(key, value, data);	
				}
				return result;
			}
			catch (exception) {
				return exception.message;
			}
		}
	}
})
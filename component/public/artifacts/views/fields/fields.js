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
		allowEditable: {
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
			var provided = nabu.page.providers("page-field-fragment");
			// if we don't allow editable fields (because we have nowhere to update them to), ignore the update types (e.g. form)
			if (!this.allowEditable) {
				provided = provided.filter(function(x) { return !x.editable });
			}
			provided = provided.map(function(x) {
				 return x.name;
			});
			provided.sort();
			return provided;
		}
	},
	methods: {
		getProvidedConfiguration: function(fragmentType) {
			var provided = nabu.page.providers("page-field-fragment").filter(function(x) {
				 return x.name == fragmentType;
			})[0];
			return provided ? provided.configure : null;
		},
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
				if (!field.hidden) {
					Vue.set(field, "hidden", null);
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
		fieldBeginning: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index > 0) {
				this.cell.state.fields.splice(index, 1);
				this.cell.state.fields.unshift(field);
			}
		},
		fieldEnd: function(field) {
			var index = this.cell.state.fields.indexOf(field);
			if (index < this.cell.state.fields.length - 1) {
				this.cell.state.fields.splice(index, 1);
				this.cell.state.fields.push(field);
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
				hidden: null,
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
		shouldStyle: {
			type: Boolean,
			required: false,
			default: true
		},
		label: {
			type: Boolean,
			required: false,
			default: null
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
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		},
		data: {
			type: Object,
			required: true
		},
		field: {
			type: Object,
			required: true
		},
		shouldStyle: {
			type: Boolean,
			required: false
		},
		label: {
			type: Boolean,
			required: false
		}
	},
	methods: {
		getDynamicClasses: function(field) {
			var classes = null;
			if (this.shouldStyle) {
				classes = this.$services.page.getDynamicClasses(field.styles, this.data, this);
			}
			else {
				classes = [];
			}
			if (this.label) {
				classes.push("with-label");
			}
			return classes;
		},
		getProvidedComponent: function(fragmentType) {
			var provided = nabu.page.providers("page-field-fragment").filter(function(x) {
				 return x.name == fragmentType;
			})[0];
			return provided ? provided.component : null;
		},
		isHidden: function(fragment) {
			if (fragment.hidden) {
				return this.$services.page.isCondition(fragment.hidden, {record:this.data}, this); 
			}
			return false;
		}
	}
});

Vue.component("page-formatted-configure", {
	template: "#page-formatted-configure",
	props: {
		page: {
			type: Object,
			required: true,
		},
		cell: {
			type: Object,
			required: true
		},
		fragment: {
			type: Object,
			required: true
		},
		allowHtml: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	created: function() {
		this.normalize(this.fragment);
	},
	computed: {
		nativeTypes: function() {
			var types = ['date', 'number', 'masterdata', 'javascript', 'text'];
			if (this.allowHtml) {
				types.push('link');
				types.push('html');
				types.push('checkbox');
			}
			return types;
		},
		types: function() {
			var types = [];
			nabu.utils.arrays.merge(types, this.nativeTypes);
			nabu.utils.arrays.merge(types, nabu.page.providers("page-format").map(function(x) { return x.name }));
			types.sort();
			return types;
		}	
	},
	methods: {
		isProvided: function(type) {
			return this.nativeTypes.indexOf(type) < 0;
		},
		getConfiguration: function(type) {
			var provider = nabu.page.providers("page-format").filter(function(x) { return x.name == type })[0];
			return provider ? provider.configure : null;
		},
		normalize: function(fragment) {
			if (!fragment.dateFormat) {
				Vue.set(fragment, "dateFormat", null);
			}
			if (!fragment.tag) {
				Vue.set(fragment, "tag", null);
			}
			if (!fragment.html) {
				Vue.set(fragment, "html", null);
			}
			if (!fragment.javascript) {
				Vue.set(fragment, "javascript", null);
			}
			if (!fragment.amountOfDecimals) {
				Vue.set(fragment, "amountOfDecimals", null);
			}
		}
	}
});

Vue.component("page-formatted", {
	template: "<component :is='tag' v-content.parameterized=\"{value:formatted,plain:fragment.format == 'text', sanitize: !isHtml, compile: !skipCompile }\"/>",
	props: {
		value: {
			required: false
		},
		fragment: {
			type: Object,
			required: true
		}
	},
	computed: {
		nativeTypes: function() {
			var types = ['date', 'number', 'masterdata', 'javascript'];
			if (this.allowHtml) {
				types.push('link');
				types.push('html');
				types.push('checkbox');
			}
			return types;
		},
		tag: function() {
			if (this.fragment.tag) {
				return this.fragment.tag;	
			}
			else {
				return "div";
			}
		},
		isHtml: function() {
			if (!this.fragment.format) {
				return false;
			}
			if (["link", "html", "checkbox"].indexOf(this.fragment.format) >= 0) {
				return true;
			}
			var self = this;
			var formatter = nabu.page.providers("page-format").filter(function(x) { return x.name == self.fragment.format })[0];
			return formatter && formatter.html;
		},
		skipCompile: function() {
			var self = this;
			var formatter = nabu.page.providers("page-format").filter(function(x) { return x.name == self.fragment.format })[0];
			return formatter && formatter.skipCompile;
		},
		formatted: function() {
			if (this.fragment.format == "checkbox") {
				return "<n-form-checkbox :value='value' />";
			}
			else if (this.value == null || typeof(this.value) == "undefined") {
				return null;
			}
			// formatting is optional
			else if (!this.fragment.format || this.fragment.format == "text") {
				return this.value;
			}
			else if (this.fragment.format == "html") {
				return this.fragment.html ? this.fragment.html : this.value;
			}
			else if (this.fragment.format == "link") {
				return "<a target='_blank' ref='noopener noreferrer nofollow' href='" + this.value + "'>" + this.value.replace(/http[s]*:\/\/([^/]+).*/, "$1") + "</a>";
			}
			// if it is native, format it that way
			else if (this.nativeTypes.indexOf(this.fragment.format) >= 0) {
				return this.$services.formatter.format(this.value, this.fragment);
			}
			// otherwise we are using a provider
			else {
				var self = this;
				return nabu.page.providers("page-format").filter(function(x) { return x.name == self.fragment.format })[0]
					.format(this.value, this.fragment);
			}
		}
	}
});
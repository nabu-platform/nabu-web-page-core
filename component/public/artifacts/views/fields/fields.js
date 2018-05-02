if (!nabu) { var nabu = {} }
if (!nabu.views) { nabu.views = {} }
if (!nabu.views.cms) { nabu.views.cms = {} }

nabu.views.cms.PageFieldsEdit = Vue.component("nabu-page-fields-edit", {
	template: "#nabu-page-fields-edit",
	props: {
		cell: {
			type: Object,
			required: true
		},
		allowMultiple: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	created: function() {
		if (!this.cell.state.fields) {
			Vue.set(this.cell.state, "fields", []);
		}
		if (!this.allowMultiple && !this.cell.state.fields.length) {
			this.addField();
		}
	},
	methods: {
		addField: function() {
			this.cell.state.fields.push({
				label: null,
				class: null,
				fragments: []
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
				key: null
			})
		},
		getKeys: function(value) {
			var keys = this.$services.page.getSimpleKeysFor(this.cell.getStateDefinition());
			return value ? keys.filter(function(x) { x.toLowerCase().indexOf(value.toLowerCase()) >= 0 }) : keys;
		}
	}
});

Vue.component("nabu-page-fields", {
	template: "#nabu-page-fields",
	props: ["data"]
});

Vue.component("nabu-page-field", {
	template: "#nabu-page-field",
	props: ["data", "field"],
	methods: {
		format: function(fragment) {
			var value = this.data[fragment.key];
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
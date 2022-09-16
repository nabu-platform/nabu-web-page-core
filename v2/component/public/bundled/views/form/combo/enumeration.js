Vue.component("page-form-input-enumeration-configure", {
	template: "#page-form-input-enumeration-configure",
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
		if (!this.field.enumerations) {
			Vue.set(this.field, "enumerations", []);
		}
	},
	methods: {
		addFixedEnumeration: function() {
			if (this.field.complex) {
				this.field.enumerations.push({value:null,key:null});
			}
			else {
				this.field.enumerations.push('');
			}
		}
	},
	watch: {
		'field.complex': function(newValue) {
			if (newValue) {
				Vue.set(this.field, "enumerations", this.field.enumerations.splice(0).map(function(x) {
					if (typeof(x) == "string") {
						return {key:x, value: null};
					}
					else {
						return x;
					}
				}));
			}
			else {
				Vue.set(this.field, "enumerations", this.field.enumerations.splice(0).map(function(x) {
					if (typeof(x) != "string") {
						return x.key;
					}
					else {
						return x;
					}
				}));
			}
		}
	}
});

Vue.component("page-form-input-enumeration", {
	template: "#page-form-input-combo",
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
		},
		readOnly: {
			type: Boolean,
			required: false
		},
		placeholder: {
			type: String,
			required: false
		}
	},
	methods: {
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		},
		formatter: function(value) {
			if (typeof(value) == "string") {
				return value;
			}
			else if (value) {
				// probably not used because we already resolve interpretations in the enumerate (?)
				if (value.value) {
					return this.$services.page.interpret(this.$services.page.translate(value.value, this), this);
				}
				else {
					return value.key;
				}
			}
		},
		extracter: function(value) {
			if (typeof(value) == "string") {
				return value;
			}
			else if (value) {
				if (value.key) {
					return this.$services.page.interpret(value.key, this);
				}
				else {
					return value.value;
				}
			}
		},
		enumerate: function(value) {
			var self = this;
			var result = this.field.enumerations.map(function(x) {
				if(typeof(x) == "string"){
					return "" + (x && x.indexOf("=") == 0 ? self.$services.page.interpret(x, self) : x);
				}
				else {
					x = nabu.utils.objects.clone(x);
					x.value = "" + (x && x.value && x.value.indexOf("=") == 0 ? self.$services.page.interpret(x.value, self) : x.value);
					return x;
				}
			}).filter(function(x) {
				if(typeof(x) == "string"){
					return !value || x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				}
				else {
					return !value || x.value.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				}
			});
			if (this.field.allowCustom && result.indexOf(value) < 0) {
				result.unshift(value);
			}
			return result;
		}
	}
});
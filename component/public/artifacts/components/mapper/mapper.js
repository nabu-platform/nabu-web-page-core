Vue.component("n-page-mapper", {
	template: "#n-page-mapper",
	props: {
		// every key is a new source to map from and contains the definitions of the fields we can map in there
		from: {
			type: Object,
			required: true
		},
		// contains the definitions of the fields we can map to
		to: {
			type: Array,
			required: true
		},
		// the resulting bindings are in here
		value: {
			type: Object,
			required: true
		}
	},
	computed: {
		sources: function() {
			return Object.keys(this.from);
		}
	},
	methods: {
		// get the possible field names for this label
		fieldsFrom: function(value, label, fields) {
			var self = this;
			if (!fields) {
				fields = [];
			}
			if (!label) {
				Object.keys(this.from).map(function(label) {
					self.fieldsFrom(value, label, fields);
				});
			}
			else {
				this.from[label].filter(function(x) {
					return !value || x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				}).map(function(x) {
					//x = label + "." + x;
					if (fields.indexOf(x) < 0) {
						fields.push(x);
					}
				})
			}
			fields.sort();
			return fields;
		},
		getValueFor: function(field) {
			return this.value[field]
				? this.value[field].split(".")[1]
				: null;
		},
		getLabelFor: function(field) {
			return this.value[field]
				? this.value[field].split(".")[0]
				: null;
		}
	}
});
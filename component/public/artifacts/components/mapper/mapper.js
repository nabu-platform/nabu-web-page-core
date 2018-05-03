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
			required: true
		},
		// the resulting bindings are in here
		value: {
			type: Object,
			required: true
		}
	},
	computed: {
		// for the label dropdown
		sources: function() {
			return Object.keys(this.from);
		}
	},
	data: function() {
		return {
			fieldsToMap: []
		}
	},
	created: function() {
		console.log("created with to", this.to,  this.$services.page.getSimpleKeysFor(this.to));
		if (this.to instanceof Array) {
			nabu.utils.arrays.merge(this.fieldsToMap, this.to);
		}
		else if (this.to) {
			nabu.utils.arrays.merge(this.fieldsToMap, this.$services.page.getSimpleKeysFor(this.to));
		}
	},
	methods: {
		// get the possible field names for this label
		fieldsFrom: function(value, label, fields) {
			var fields = this.$services.page.getSimpleKeysFor(this.from[label]);
			if (value) {
				fields = fields.filter(function(x) { x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			return fields;
		},
		getValueFor: function(field) {
			return this.value[field]
				? this.value[field].substring(this.value[field].indexOf(".") + 1)
				: null;
		},
		getLabelFor: function(field) {
			return this.value[field]
				? this.value[field].split(".")[0]
				: null;
		}
	}
});
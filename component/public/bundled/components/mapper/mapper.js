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
			var sources = Object.keys(this.from);
			// allow fixed values
			sources.push("fixed");
			// allow enumerations
			nabu.utils.arrays.merge(sources, nabu.page.providers("page-enumerate").map(function(x) {
				return x.name;
			}));
			sources.sort();
			return sources;
		}
	},
	data: function() {
		return {
			fieldsToMap: []
		}
	},
	created: function() {
		if (this.to instanceof Array) {
			nabu.utils.arrays.merge(this.fieldsToMap, this.to);
		}
		else if (this.to) {
			nabu.utils.arrays.merge(this.fieldsToMap, this.$services.page.getSimpleKeysFor(this.to, true, true));
		}
	},
	methods: {
		// get the possible field names for this label
		fieldsFrom: function(value, label, fields) {
			if (label == "fixed") {
				return value ? [value] : [];
			}
			var provider = nabu.page.providers("page-enumerate").filter(function(x) { return x.name == label })[0];
			if (provider) {
				var enumerations = provider.enumerate();
				if (provider.label) {
					enumerations = enumerations.map(function(x) { return x[provider.label ]});
				}
				return enumerations;
			}
			var fields = this.$services.page.getSimpleKeysFor(this.from[label], true, true);
			if (value) {
				fields = fields.filter(function(x) { x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			fields.push("$all");
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

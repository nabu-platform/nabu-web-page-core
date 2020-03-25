Vue.view("nabu-console", {
	data: function() {
		return {
			selected: null,
			search: null
		}
	},
	methods: {
		isHidden: function(report) {
			if (!this.search) {
				return false;
			}
			else {
				var self = this;
				var matches = function(string) {
					return string && string.toLowerCase().match(new RegExp(self.search.replace("*", ".*"), "mi"));
				}
				var match = matches(report.source)
					|| matches(report.type)
					|| matches(JSON.stringify(report.properties));
				return !match;
			}
		}
	}
});
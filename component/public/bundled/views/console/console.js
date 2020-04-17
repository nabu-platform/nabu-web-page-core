Vue.view("nabu-console", {
	data: function() {
		return {
			selected: null,
			search: null,
			tab: "events"
		}
	},
	computed: {
		enabledFeatures: function() {
			var self = this;
			return this.$services.page.availableFeatures.filter(function(x) {
				return self.$services.page.enabledFeatures.indexOf(x.name) >= 0;
			});
		},
		disabledFeatures: function() {
			var self = this;
			return this.$services.page.availableFeatures.filter(function(x) {
				return self.$services.page.enabledFeatures.indexOf(x.name) < 0;
			});
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
		},
		resetFeatures: function() {
			// we update the enabled features array in page builder
			this.$services.page.enabledFeatures.splice(0);
			// remerge the standard enabled features
			nabu.utils.arrays.merge(
				this.$services.page.enabledFeatures, 
				this.$services.page.availableFeatures.filter(function(x) { return x.enabled }).map(function(x) { return x.name })
			);
			// clean up the toggled features
			this.$services.page.toggledFeatures.splice(0);
			if (this.$services.swagger.toggledFeatures) {
				this.$services.swagger.toggledFeatures.splice(0);	
			}
		},
		enableFeature: function(feature) {
			// we need to check if it is enabled by default
			var available = this.$services.page.availableFeatures.filter(function(x) { return x.name == feature.name })[0];
			var toggled = this.$services.page.toggledFeatures.filter(function(x) { return x.name == feature.name })[0];
			// remove any toggled features
			if (toggled) {
				this.$services.page.toggledFeatures.splice(this.$services.page.toggledFeatures.indexOf(toggled), 1);
			}
			// make sure it is in the list of enabled features
			this.$services.page.enabledFeatures.push(available.name);
			// we only need to do something special (add it to toggled) if it is not enabled by default
			if (available && !available.enabled) {
				this.$services.page.toggledFeatures.push({
					name: feature.name,
					description: feature.description,
					enabled: true
				});
			}
			// synchronize swagger
			if (this.$services.swagger.toggledFeatures) {
				this.$services.swagger.toggledFeatures.splice(0);
				nabu.utils.arrays.merge(this.$services.swagger.toggledFeatures, this.$services.page.toggledFeatures);
			}
		},
		disableFeature: function(feature) {
			// we need to check if it is enabled by default
			var available = this.$services.page.availableFeatures.filter(function(x) { return x.name == feature.name })[0];
			var toggled = this.$services.page.toggledFeatures.filter(function(x) { return x.name == feature.name })[0];
			// remove any toggled features
			if (toggled) {
				this.$services.page.toggledFeatures.splice(this.$services.page.toggledFeatures.indexOf(toggled), 1);
			}
			var index = this.$services.page.enabledFeatures.indexOf(available.name);
			if (index >= 0) {
				this.$services.page.enabledFeatures.splice(index, 1);
			}
			// we only need to do something special (add it to toggled) if it is not enabled by default
			if (available && available.enabled) {
				this.$services.page.toggledFeatures.push({
					name: feature.name,
					description: feature.description,
					enabled: false
				});
			}
			// synchronize swagger
			if (this.$services.swagger.toggledFeatures) {
				this.$services.swagger.toggledFeatures.splice(0);
				nabu.utils.arrays.merge(this.$services.swagger.toggledFeatures, this.$services.page.toggledFeatures);
			}
		}
	}
});
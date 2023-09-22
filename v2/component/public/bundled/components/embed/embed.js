Vue.component("page-embed-component", {
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		}
	},
	methods: {
		getBindings: function() {
			var result = {};
			var self = this;
			if (this.cell.state.embedBindings) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				Object.keys(this.cell.state.embedBindings).forEach(function(key) {
					var binding = self.cell.state.embedBindings[key];
					if (binding) {
						var value = self.$services.page.getBindingValue(pageInstance, binding, self);
						if (value != null) {
							self.$services.page.setValue(result, key, value);
						}
					}
				})
			}
			return result;
		}
	}
})

Vue.component("page-embed-component", {
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		}
	}
})
Vue.view("page-image-dynamic", {
	category: "Media",
	name: "Dynamic Image",
	description: "Position a dynamic image based on an operation",
	icon: "page/core/images/image.svg",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
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
		}
	},
	data: function() {
		return {
			href: null
		}
	},
	methods: {
		configurator: function() {
			return "page-image-dynamic-configure";
		},
		getChildComponents: function() {
			return [{
				title: "Image",
				name: "image",
				component: "image"
			}];
		},
		calculateUrl: function() {
			if (this.cell.state.imageOperation) {
				var operation = this.$services.swagger.operations[this.cell.state.imageOperation];
				var properties = this.$services.page.getBindings(this.cell.state.bindings, this);
				var self = this;
				// we need temporary credentials
				if (operation["x-temporary-id"] && operation["x-temporary-secret"] && this.$services.user && this.$services.user.ltp) {
					this.$services.user.ltp(operation.id).then(function(authorization) {
						properties[operation["x-temporary-id"]] = authorization.authenticationId;
						properties[operation["x-temporary-secret"]] = authorization.secret;
						self.href = self.$services.swagger.parameters(operation.id, properties).url;
					}, function(e) {
						self.href = null;
						console.log("Could not get ltp for", operation.id, e);
					});
				}
				else {
					self.href = self.$services.swagger.properties(operation.id, properties).url;
				}
			}
		}
	},
	// load the image url
	created: function() {
		this.calculateUrl();
	}
});

Vue.component("page-image-dynamic-configure", {
	template: "#page-image-dynamic-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	created: function() {
		if (!this.cell.state.bindings) {
			Vue.set(this.cell.state, "bindings", {});
		}
	}
})
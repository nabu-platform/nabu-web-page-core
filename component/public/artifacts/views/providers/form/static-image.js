Vue.component("page-form-input-static-image-configure", {
	template: "<n-form-text v-model='field.imagePath' label='Image Path'/>",
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
		}
	},
	created: function() {
		if (!field.imagePath) {
			Vue.set(field, "imagePath", "images")
		}
	}
});

Vue.component("page-form-input-static-image", {
	template: "<div class='page-form-input-static-image n-form-component'><label class='n-form-label' v-if='label'>{{label}}</label><div class='image-content'><img v-if='value' :src=\"'${server.root()}' + value\"/>"
		+ "<n-input-file v-model='files' @change='upload' :types=\"['image']\"/></div></div>",
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
		}
	},
	data: function() {
		return {
			files: []
		}
	},
	methods: {
		upload: function() {
			var self = this;
			this.$services.swagger.execute("nabu.web.page.core.rest.resource.create", { path:this.field.imagePath, body: this.files[0] }).then(function(result) {
				self.files.splice(0, self.files.length);
				self.$emit("input", result.relativePath);
			});
		},
	}
});
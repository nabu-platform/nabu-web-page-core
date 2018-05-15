Vue.component("page-field-fragment-image-configure", {
	template: "#page-field-fragment-image-configure",
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
		fragment: {
			type: Object,
			required: true
		},
		// available data keys
		// this could be generated for cell/page but could also be provided by a wrapper component
		keys: {
			type: Array,
			required: true
		}
	},
	created: function() {
		if (!this.fragment.imageHref) {
			Vue.set(this.fragment, "imageHref", null);
		}
		if (!this.fragment.imageTitle) {
			Vue.set(this.fragment, "imageTitle", null);
		}
		if (!this.fragment.imageHeight) {
			Vue.set(this.fragment, "imageHeight", null);
		}
		if (!this.fragment.imageSize) {
			Vue.set(this.fragment, "imageSize", 'cover');
		}
	}
});

Vue.component("page-field-fragment-image", {
	template: "<div class='image' :style=\"{'background-image': 'url(' + (fragment.imageHref ? data[fragment.imageHref] : null) + ')', height: fragment.imageHeight ? fragment.imageHeight : 'inherit', 'background-size': fragment.imageSize }\"></div>",
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
		fragment: {
			type: Object,
			required: true
		},
		data: {
			type: Object,
			required: true
		}
	}
});
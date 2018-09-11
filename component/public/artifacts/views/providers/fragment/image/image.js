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
		if (!this.fragment.fixedHref) {
			Vue.set(this.fragment, "fixedHref", false);
		}
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
	template: "<div class='image' :style=\"{'background-image': 'url(' + href + ')', height: fragment.imageHeight ? fragment.imageHeight : 'inherit', 'background-size': fragment.imageSize, 'background-repeat': 'no-repeat', 'background-position': 'center' }\"></div>",
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
	},
	computed: {
		href: function() {
			if (this.fragment.fixedHref) {
				return this.fragment.imageHref;
			}
			else if (this.fragment.imageHref) {
				return this.$services.page.getValue(this.data, this.fragment.imageHref);
			}
		}
	}
});
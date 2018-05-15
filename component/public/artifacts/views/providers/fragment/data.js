Vue.component("page-field-fragment-data-configure", {
	template: "<page-formatted-configure :fragment='fragment' :allow-html='true'/>",
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
		}
	}
});

Vue.component("page-field-fragment-data", {
	template: "<page-formatted :value='$services.page.getValue(data, fragment.key)' :fragment='fragment'/>",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
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
Vue.component("page-field-fragment-javascript-configure", {
	template: "<n-form-section>"
		+ "		<n-ace mode='javascript' v-model='fragment.content'/>"
		+ "		<n-form-combo label='Type' v-model='fragment.tag' :items=\"['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div']\"/>"
		+ "</n-form-section>",
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
	},
	created: function() {
		if (!this.fragment.content) {
			Vue.set(this.fragment, "content", null);
		}
		if (!this.fragment.tag) {
			Vue.set(this.fragment, "tag", null);
		}
	}
});

Vue.component("page-field-fragment-javascript", {
	template: "<component :is='tag'>{{value}}</component>",
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
	},
	computed: {
		value: function() {
			return this.$services.page.eval(this.fragment.content, this.data);
		},
		tag: function() {
			if (this.fragment.tag) {
				return this.fragment.tag;	
			}
			else {
				return "span";
			}
		}
	}
});
if (!nabu) { var nabu = {} };
if (!nabu.views) { nabu.views = {} };
if (!nabu.views.page) { nabu.views.page = {} };

nabu.views.page.Image = Vue.extend({
	template: "#page-image",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
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
	created: function() {
		this.normalize(this.cell.state);
	},
	data: function() {
		return {
			configuring: false
		}
	},
	methods: {
		configure: function() {
			this.configuring = true;	
		},
		normalize: function(state) {
			if (!state.href) {
				Vue.set(state, "href", null);
			}
			if (!state.title) {
				Vue.set(state, "title", null);
			}
			if (!state.height) {
				Vue.set(state, "height", null);
			}
			if (!state.size) {
				Vue.set(state, "size", 'contain');
			}
		}
	}
})
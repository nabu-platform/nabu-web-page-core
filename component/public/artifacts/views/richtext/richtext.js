if (!nabu) { var nabu = {} };
if (!nabu.views) { nabu.views = {} };
if (!nabu.views.page) { nabu.views.page = {} };

nabu.views.page.Richtext = Vue.extend({
	template: "#page-richtext",
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
		Vue.set(this, "state", this.$services.page.instances[this.page.name].variables);
	},
	data: function() {
		return {
			configuring: false,
			state: null
		}
	},
	methods: {
		configure: function() {
			this.configuring = true;	
		},
		normalize: function(state) {
			if (!state.content) {
				Vue.set(state, "content", null);
			}
		}
	}
})
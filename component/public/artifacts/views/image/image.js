if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

nabu.page.views.Image = Vue.extend({
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
		},
		href: {
			type: String,
			required: false
		}
	},
	activate: function(done) {
		var self = this;
		if (this.edit) {
			this.load().then(done);
		}
		else {
			done();
		}
	},
	created: function() {
		this.normalize(this.cell.state);
	},
	data: function() {
		return {
			configuring: false,
			images: [],
			files: []
		}
	},
	methods: {
		load: function() {
			var self = this;
			return this.$services.swagger.execute("nabu.web.page.core.rest.image.list").then(function(list) {
				self.images.splice(0, self.images.length);
				if (list.images) {
					nabu.utils.arrays.merge(self.images, list.images);
				}
			});
		},
		upload: function() {
			var self = this;
			this.$services.swagger.execute("nabu.web.page.core.rest.image.create", { body: this.files[0] }).then(function() {
				self.load();
				self.files.splice(0, self.files.length);
			});
		},
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
				Vue.set(state, "height", "15rem");
			}
			if (!state.size) {
				Vue.set(state, "size", 'cover');
			}
		}
	}
})
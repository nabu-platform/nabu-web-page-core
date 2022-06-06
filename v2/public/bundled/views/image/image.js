if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

Vue.view("page-image", {
	category: "Media",
	name: "Image",
	description: "Position an image with this component",
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
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	activate: function(done) {
		var self = this;
		var promises = [];
		// won't trigger with the new configuration thing as activate() doesn't work for components
		if (this.edit) {
			promises.push(this.load());
		}
		if (this.cell.state.inline && (this.cell.state.href || this.href)) {
			var self = this;
			var href = this.cell.state.href ? this.cell.state.href : this.href;
			// if not absolute, make it so
			if (href.indexOf("http://") != 0 && href.indexOf("https://") != 0 && href.indexOf("/") != 0) {
				href = "${server.root()}" + href;
			}
			nabu.utils.ajax({ url: href }).then(function(response) {
				self.inlineContent = response.responseText;
			});
		}
		this.$services.q.all(promises).then(done, done);
	},
	data: function() {
		return {
			images: [],
			files: [],
			inlineContent: null
		}
	},
	computed: {
		href: function() {
			var href = null;
			if (this.cell.state.href) {
				href = this.$services.page.interpret(this.cell.state.href, this);
			}
			// if the href is not an absolute one (either globally absolute or application absolute), we inject the server root
			if (href && href.substring(0, 7) != "http://" && href.substring(0, 8) != "https://" && href.substring(0, 1) != "/") {
				href = "${server.root()}" + href;
			}
			if (href && href.substring(0, 7) != "http://" && href.substring(0, 8) != "https://" && this.cell.state.absolute) {
				href = "${environment('url')}" + href;
			}
			// on mobile we don't want absolute paths starting with "/", otherwise it won't fetch from the file system
			else if (href && href.substring(0, 7) != "http://" && href.substring(0, 8) != "https://" && ${environment("mobile") == true} && href.indexOf("/") == 0) {
				href = href.substring(1);
			}
			return href;
		},
		hasPrevious: function() {
			var self = this;
			var entry = this.images.filter(function(x) {
				return x.relativePath == self.cell.state.href;
			})[0];
			return entry && this.images.indexOf(entry) > 0;
		},
		hasNext: function() {
			if (!this.cell.state.href && this.images.length > 0) {
				return true;
			}
			var self = this;
			var entry = this.images.filter(function(x) {
				return x.relativePath == self.cell.state.href;
			})[0];
			return entry && this.images.indexOf(entry) < this.images.length - 1;
		}
	},
	methods: {
		next: function() {
			var self = this;
			if (!this.cell.state.href) {
				Vue.set(this.cell.state, "href", this.images[0].relativePath);
			}
			else {
				var entry = this.images.filter(function(x) {
					return x.relativePath == self.cell.state.href;
				})[0];
				if (entry) {
					var index = this.images.indexOf(entry);
					this.cell.state.href = this.images[index + 1].relativePath;
				}
			}
		},
		previous: function() {
			var self = this;
			var entry = this.images.filter(function(x) {
				return x.relativePath == self.cell.state.href;
			})[0];
			if (entry) {
				var index = this.images.indexOf(entry);
				this.cell.state.href = this.images[index - 1].relativePath;
			}
		},
		configurator: function() {
			return "page-image-configure";
		},
		load: function() {
			var self = this;
			return this.$services.swagger.execute("nabu.web.page.core.rest.resource.list", {path:this.cell.state.imagePath}).then(function(list) {
				self.images.splice(0);
				if (list && list.resources) {
					nabu.utils.arrays.merge(self.images, list.resources);
				}
			});
		},
		upload: function() {
			var self = this;
			this.$services.swagger.execute("nabu.web.page.core.rest.resource.create", { path:this.cell.state.imagePath, body: this.files[0] }).then(function(result) {
				self.load();
				if (result && result.relativePath) {
					self.cell.state.href = result.relativePath;
				}
				self.files.splice(0, self.files.length);
			});
		}
	},
	watch: {
		'cell.state.imagePath': function() {
			this.load();
		}
	}
})

Vue.component("page-image-configure", {
	template: "#page-image-configure"
})
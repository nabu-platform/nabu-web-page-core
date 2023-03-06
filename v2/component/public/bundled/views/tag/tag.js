// the v-html directive actually allows for self-XSS so switched it to sanitized content
Vue.view("page-tag", {
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
	name: "Tag",
	category: "Data",
	description: "A tag",
	icon: "link",
	created: function() {
		this.elementPromise = this.$services.q.defer();
	},
	ready: function() {
		this.elementPromise.resolve(this.$el);	
	},
	data: function() {
		return {
			requiresPagePrefix: false
		}
	},
	computed: {
		icon: function() {
			var icon = this.cell.state.icon;
			return icon ? icon : "times";
		}
	},
	methods: {
		isCellHidden: function() {
			return this.getValue() == null;	
		},
		reset: function() {
			if (this.cell.state.field) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				pageInstance.set(this.cell.state.field, null);
				if (this.requiresPagePrefix) {
					pageInstance.set("page." + this.cell.state.field, null);	
				}
			}	
		},
		getValue: function() {
			if (!this.cell.state.field) {
				return null;
			}
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			var value = pageInstance.getLabel(this.cell.state.field);
			if (value == null) {
				value = pageInstance.getLabel("page." + this.cell.state.field);
				if (value != null) {
					this.requiresPagePrefix = true;
				}
			}
			if (value == null) {
				value = pageInstance.get(this.cell.state.field);
			}
			// toggle the cell
			if (value != null) {
				this.$emit("show");
			}
			else {
				this.$emit("hide");
			}
			return value;
		},
		getChildComponents: function() {
			return [{
				title: "Tag",
				name: "page-tag",
				component: "badge"
			}]	
		},
		configurator: function() {
			return "page-tag-configure";
		},
		update: function() {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			var self = this;
			if (this.$refs.editor) {
				var last = self.$refs.editor.innerHTML;
				this.timer = setTimeout(function() {
					self.cell.state.content = nabu.utils.elements.sanitize(self.$refs.editor ? self.$refs.editor.innerHTML : last);
				}, 100);
			}
		}
	}
});

Vue.component("page-tag-configure", {
	template: "#page-tag-configure",
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
	}
});
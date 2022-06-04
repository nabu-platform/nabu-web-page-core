Vue.view("page-button", {
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
	name: "Button",
	category: "Interactive",
	description: "A button to send out events, go to a different page,...",
	icon: "link",
	data: function() {
		return {
			timer: null
		}
	},
	methods: {
		handle: function() {
			if (!this.edit) {
				console.log("do something");
			}
		},
		configurator: function() {
			return "page-button-configure";
		},
		update: function() {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			var self = this;
			var last = self.$refs.editor.innerHTML;
			this.timer = setTimeout(function() {
				self.cell.state.content = nabu.utils.elements.sanitize(self.$refs.editor ? self.$refs.editor.innerHTML : last);
			}, 100);
		}
	}
});

Vue.view("page-button2", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	data: function() {
		return {
			tag: "button",
			placeholder: "Button label"
		}
	},
	name: "Button",
	category: "Interactive",
	description: "A button to send out events, go to a different page,...",
	icon: "link"
});


Vue.component("page-button-configure", {
	template: "#page-button-configure",
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
})
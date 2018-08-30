Vue.component("n-form-page", {
	template: "#n-form-page",
	props: {
		value:  {
			required: true
		},
		timeout: {
			type: Number,
			required: false,
			default: 600
		}
	},
	data: function() {
		return {
			page: null,
			timer: null
		}
	},
	created: function() {
		this.page = {
			name: "dynamic-page-" + this.$services.page.counter++,
			content: this.$services.page.normalize({})
		};
	},
	methods: {
		update: function() {
			var content = JSON.stringify(this.page.content);
			if (content != this.value) {
				this.$emit("input", content);
			}
		},
		validate: function() {
			return [];
		}
	},
	watch: {
		page: {
			handler: function(newValue) {
				if (this.timer) {
					clearTimeout(this.timer);
					this.timer = null;
				}
				this.timer = setTimeout(this.update, this.timeout);
			},
			deep: true
		}
	}
});
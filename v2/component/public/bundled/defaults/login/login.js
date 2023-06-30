Vue.view("default-login", {
	priority: -50,
	alias: "login",
	url: "/login",
	props: {
		route: {
			type: String,
			required: false,
			default: "home"
		},
		url: {
			type: String,
			required: false
		}
	},
	data: function() {
		return {
			username: null,
			password: null,
			remember: true,
			working: false,
			valid: false,
			messages: []
		};
	},
	methods: {
		login: function() {
			if (this.validate(true)) {
				this.messages.splice(0, this.messages.length);
				this.working = true;
				var self = this;
				return this.$services.user.login(this.username, this.password, this.remember).then(
					function(profile) {
						if (self.url) {
							window.location.href = self.url;
						}
						else {
							self.$services.router.route(self.route);
						}
						self.working = false;
					},
					function(error) {
						self.messages.push({
							title: self.$services.page.translate("%{default::Login failed}"),
							severity: "error"
						})
						self.working = false;
					});
			}
		},
		validate: function(hard) {
			var messages = this.$refs.form.validate(!hard);
			this.valid = messages.length == 0;
			return this.valid;
		}
	}
});
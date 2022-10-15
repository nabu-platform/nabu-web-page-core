Vue.view("default-error", {
	priority: -50,
	alias: "error",
	url: "/error",
	props: {
		icon: {
			type: String,
			default: "times"
		},
		title: {
			type: String,
			default: "%{A problem has occurred!}"
		},
		message: {
			type: String,
			default: "%{Sorry, your action could not be completed.}"
		},
		recover: {
			type: String,
			default: "%{Return to the&nbsp;<a class='is-color-link' v-route:home>home page</a>.}"
		},
		errorId: {
			type: String
		}
	}
});
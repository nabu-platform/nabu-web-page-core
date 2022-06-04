nabu.page.provide("page-renderer", {
	title: "Menu",
	name: "menu",
	type: "row",
	component: "renderer-menu",
	configuration: "renderer-menu-configure",
	// can emit events
	// e.g. a success event for form submit
	// an error event
	// a submit event (with the input state)
	getEvents: function(container) {
		var result = {};
		if (container.state && nabu.page.event.getName(container.state, "handledEvent") != null) {
			var type = nabu.page.event.getType(container.state, "handledEvent");
			/* not yet?
			if (type.properties && Object.keys(type.properties).length == 0 && container.on) {
				type = container.on;
			}
			*/
			result[nabu.page.event.getName(container.state, "handledEvent")] = type;
		}
		return result;
	},
	// return the child components in play for the given container
	// these can be added to the list of stuff to style
	getChildComponents: function(container) {
		return [{
			title: "Menu",
			name: "renderer-menu",
			component: "menu"
		}];
	}
});


Vue.component("renderer-menu", {
	template: "#renderer-menu",
	props: {
		page: {
			type: Object,
			required: true
		},
		// the target (cell or row)
		target: {
			type: Object,
			required: true
		},
		// whether or not we are in edit mode (we can do things slightly different)
		edit: {
			type: Boolean,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		}
	},
	methods: {
		handle: function() {
			console.log("clicked on menu");
			if (nabu.page.event.getName(this.target.state, "handledEvent")) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				pageInstance.emit(
					nabu.page.event.getName(this.target.state, "handledEvent"),
					nabu.page.event.getInstance(this.target.state, "handledEvent", this.page, this)
				);
			}
		}
	}
});

Vue.component("renderer-menu-configure", {
	template: "#renderer-menu-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		// the target (cell or row)
		target: {
			type: Object,
			required: true
		},
		// whether or not we are in edit mode (we can do things slightly different)
		edit: {
			type: Boolean,
			required: false
		}
	},
	created: function() {
		if (!this.target.state) {
			Vue.set(this.target, "state", {});
		}
	}
});
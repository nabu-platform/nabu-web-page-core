nabu.page.provide("page-renderer", {
	name: "Menu",
	type: "row",
	component: "renderer-menu",
	configuration: "renderer-menu-configure",
	// can emit events
	// e.g. a success event for form submit
	// an error event
	// a submit event (with the input state)
	events: function(container) {
		// TODO: finalizing event to close the shizzle again?
	},
	// return the child components in play for the given container
	// these can be added to the list of stuff to style
	childComponents: function(container) {
		
	}
});


Vue.component("renderer-menu", {
	template: "#renderer-menu"	
});

Vue.component("renderer-menu-configure", {
	template: "#renderer-menu-configure"	
});
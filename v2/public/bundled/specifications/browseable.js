// unlike pageable where we know the amount of pages and can do random jumps
// with browseable we can only go forward and back a page
// when going forward we can choose to append the data (in a load-more scenario)
nabu.page.provide("page-specification", {
	name: "browseable",
	actions: [{
			title: "Next Page",
			name: "next-page",
			input: {
				append: {
					type: "boolean"
				}
			},
			output: {}
		}, {
			title: "Previous Page", 
			name: "previous-page",
			input: {},
			output: {}
	}]
});
// to be pageable we must be able to determine which page you are on
// and be able to jump to a random page

nabu.page.provide("page-specification", {
	name: "pageable",
	actions: [
		{
			title: "Jump to page",
			name: "jump-page",
			input: {
				page: {
					type: "int64"
				}
			}
		},
		{
			title: "Get Paging",
			name: "get-paging",
			input: {},
			// the naming is not very clear, but at least it is inline with the backend...
			output: {
				// current page
				current: {
					type: "int64"
				},
				// the total amount of pages
				total: {
					type: "int64"
				},
				// how many items on a page
				pageSize: {
					type: "int64"
				},
				// the offset in rows
				rowOffset: {
					type: "int64"
				},
				// total amount of rows available
				totalCount: {
					type: "int64"
				}
			}
		}
	]
});
// considerations:
// colspans
// rowspans (for row grouping)
// tbody, tr, td correct elements

nabu.page.provide("page-type", {
	name: "table-page",
	rowTag: function(row, depth, editing) {
		return "tr";
	},
	cellTag: function(cell, depth, editing) {
		return "td";
	},
	repeatTag: function(target) {
		return "tbody";
	},
	cellComponent: function(cell) {
		return "table-column";
	},
	rowComponent: function(cell) {
		return "table-row";
	},
	repeatComponent: function(target) {
		return "table-body"
	}
});

// table should expose action to "order by" (takes a list)
// we can use click events on the columns to trigger an action on the table to order by
// the orderby should also be exposed as state? we can check if a certain field is ordered by and in which direction
// we can use this to conditionally render the sort icon

nabu.page.provide("page-renderer", {
	title: "Table",
	name: "table",
	type: ["cell"],
	component: "renderer-table",
	configuration: "renderer-table-configure",
	cssComponent: "table",
	getChildComponents: function(target) {
		return [{
			title: "Table",
			name: "table",
			component: "table"
		}];
	},
	getPageType: function(target) {
		return "table-page";
	},
	getSlots: function(target) {
		return ["header", "footer"];
	}
});


Vue.component("renderer-table", {
	template: "#renderer-table"	
});


Vue.component("renderer-table-configure", {
	template: "#renderer-table-configure"	
});
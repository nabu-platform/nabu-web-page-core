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
		return "renderer-table-body-cell";
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
	},
	// cells can have colspans!
	getChildConfig: function(target, child, path) {
		if (child.rows) {
			return "renderer-table-cell-configure";
		}
	}
});


Vue.component("renderer-table", {
	template: "#renderer-table",
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
	}
});


Vue.component("renderer-table-configure", {
	template: "#renderer-table-configure"	
});

Vue.component("renderer-table-cell-configure", {
	template: "#renderer-table-cell-configure",
	props: {
		cell: {
			type: Object
		},
		row: {
			type: Object
		},
		page: {
			type: Object
		}
	},
	created: function() {
		if (this.cell && !this.cell.table) {
			Vue.set(this.cell, "table", {});
		}
	}
});

Vue.component("renderer-table-body-cell", {
	template: "#renderer-table-body-cell",
	props: {
		target: {
			type: Object
		},
		page: {
			type: Object
		}
	},
	computed: {
		// TODO: if colspan is 0, calculate the amount of columns!
		colspan: function() {
			return this.target && this.target.table ? this.target.table.colspan : null;
		}
	}
});


Vue.component("renderer-table-header-cell", {
	template: "#renderer-table-header-cell",
	props: {
		target: {
			type: Object
		},
		page: {
			type: Object
		}
	},
	computed: {
		colspan: function() {
			return this.target && this.target.table ? this.target.table.colspan : null;
		}
	}
});

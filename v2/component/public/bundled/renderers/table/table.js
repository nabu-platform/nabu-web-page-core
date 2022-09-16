// considerations:
// colspans
// rowspans (for row grouping)
// tbody, tr, td correct elements

nabu.page.provide("page-type", {
	name: "table-page",
	rowTag: function(row, depth, editing, reversePath) {
		// it must be inside the table, this goes for header, footer & body, for example for body depth:
		// <column> <repeat> <table>
		var isRow = reversePath.length >= 2 && reversePath[1].renderer == "table";
		// in a repeat (e.g. the body), you are in a page fragment
		// to be a valid cell INSIDE a table, you need at least 3 levels
		// the repeat spins off a fragment page with the correct page type (e.g. table), but not the necessary depth
		isRow |= reversePath.length == 1;
		if (isRow) {
			return "tr";
		}
		else {
			return null;
		}
	},
	cellTag: function(row, cell, depth, editing, reversePath) {
		// it must be inside the table, this goes for header, footer & body, for example for body depth:
		// <column> <repeat> <table>
		var isColumn = reversePath.length >= 3 && reversePath[2].renderer == "table";
		// in a repeat (e.g. the body), you are in a page fragment
		// to be a valid cell INSIDE a table, you need at least 3 levels
		// the repeat spins off a fragment page with the correct page type (e.g. table), but not the necessary depth
		isColumn |= reversePath.length == 2;
		var isHeader = isColumn && reversePath.length >= 2 && reversePath[1].rendererSlot == "header";
		if (isHeader) {
			return "renderer-table-header-cell";
		}
		else if (isColumn) {
			return "renderer-table-body-cell";
		}
		else {
			return null;
		}
	},
	repeatTag: function(target) {
		return "tbody";
	},
	cellComponent: function(cell, reversePath) {
		var isColumn = reversePath.length >= 3 && reversePath[2].renderer == "table";
		isColumn |= reversePath.length == 2;
		return isColumn ? "table-column" : null;
	},
	rowComponent: function(cell, reversePath) {
		var isRow = reversePath.length >= 2 && reversePath[1].renderer == "table";
		isRow |= reversePath.length == 1;
		return isRow ? "table-row" : null;
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

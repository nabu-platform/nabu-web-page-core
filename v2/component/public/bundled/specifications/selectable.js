// when you can select something, e.g. in a table
nabu.page.provide("page-specification", {
	name: "selectable",
	state: {
		selected: {
			type: "array",
			items: {
				type: "object"
			}
		}
	},
	actions: [{
		title: "Select",
		name: "select",
		input: {
			item: {
				type: "object"	
			},
			append: {
				type: "boolean"
			}
		},
		output: {
		}
	}]
});
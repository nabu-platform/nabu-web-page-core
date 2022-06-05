Vue.component("typography-core-configure", {
	template: "#typography-template-configure",	
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	data: function() {
		return {
			icon: true
		}
	},
	created: function() {
		if (!this.cell.state.fragments) {
			Vue.set(this.cell.state, "fragments", {});
		}	
		var self = this;
		this.variables.forEach(function(x) {
			if (!self.cell.state.fragments[x]) {
				Vue.set(self.cell.state.fragments, x, {});
			}
		})
	},
	computed: {
		variables: function() {
			var variables = [];
			var index = 0;
			var disqualifiers = ["%", "$", "{"];
			while (index >= 0) {
				// find next match
				index = this.cell.state.content.indexOf("{", index);
				if (index < 0) {
					break;
				}
				// make sure we don't intercept other stuff
				var disqualified = index > 0 && disqualifiers.indexOf(this.cell.state.content.charAt(index - 1)) >= 0;
				if (!disqualified) {
					var endIndex = this.cell.state.content.indexOf("}", index);
					// no closing bracket
					if (endIndex < 0) {
						break;
					}
					var substring = this.cell.state.content.substring(index, endIndex + 1);
					// if it contains another opening tag (because we are hitting the first of {{ or because you have nested tags), we skip it
					if (substring.substring(1).indexOf("{") < 0) {
						variables.push(substring.substring(1, substring.length - 1));
					}
					index = endIndex + 1;
				}
				else {
					index++;
				}
			}
			return variables;
		}
	}
});
Vue.component("typography-core", {
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	data: function() {
		return {
			timer: null
		}
	},
	// copy paste from above!
	computed: {
		variables: function() {
			var variables = [];
			var index = 0;
			var disqualifiers = ["%", "$", "{"];
			while (index >= 0) {
				// find next match
				index = this.cell.state.content.indexOf("{", index);
				if (index < 0) {
					break;
				}
				// make sure we don't intercept other stuff
				var disqualified = index > 0 && disqualifiers.indexOf(this.cell.state.content.charAt(index - 1)) >= 0;
				if (!disqualified) {
					var endIndex = this.cell.state.content.indexOf("}", index);
					// no closing bracket
					if (endIndex < 0) {
						break;
					}
					var substring = this.cell.state.content.substring(index, endIndex + 1);
					// if it contains another opening tag (because we are hitting the first of {{ or because you have nested tags), we skip it
					if (substring.substring(1).indexOf("{") < 0) {
						var variable = substring.substring(1, substring.length - 1);
						if (variables.indexOf(variable) < 0) {
							variables.push(variable);
						}
					}
					index = endIndex + 1;
				}
				else {
					index++;
				}
			}
			return variables;
		}
	},
	methods: {
		getContentWithVariables: function() {
			var content = this.cell.state.content;
			var self = this;
			var component = Vue.component("page-formatted");
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			this.variables.forEach(function(variable) {
				// we must at the very least have selected a key
				if (self.cell.state.fragments && self.cell.state.fragments[variable] && self.cell.state.fragments[variable].key) {
					//content = content.replace(new RegExp("\{[\s]*" + variable + "[\s]*\}", "g"), "<page-formatted :page='page' :cell='cell' :value=\"getVariableValue('" + variable + "')\" :fragment=\"getVariableFragment('" + variable + "')\"/>");
					var div = document.createElement("div");
					var formatted = new component({propsData: {
						page: self.page,
						cell: self.cell,
						value: pageInstance.get(self.cell.state.fragments[variable].key),
						fragment: self.cell.state.fragments[variable]
					}});
					formatted.$mount();
					content = content.replace(new RegExp("\{[\s]*" + variable + "[\s]*\}", "g"), formatted.$el.outerHTML);
				}
			});
			return content;
		},
		getVariableValue: function(variable) {
			console.log("getting value for", variable);
		},
		getVariableFragment: function(variable) {
			return this.cell.state.fragments[variable];
		},
		highlight: function(content) {
			var highlighter = nabu.page.providers("page-format").filter(function(x) {
				 return x.name == "highlight";
			})[0];
			return highlighter ? highlighter.format(content, this.cell.state.highlightFormat ? "language-" + this.cell.state.highlightFormat : null) : content;
		},
		getChildComponents: function() {
			return [{
				title: "Typography",
				name: "typography",
				defaultVariant: "typography-" + this.tag,
				component: "content"
			}]
		},
		configurator: function() {
			return "typography-core-configure";
		},
		update: function() {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			var self = this;
			var last = self.$refs.editor.innerHTML;
			this.timer = setTimeout(function() {
				self.cell.state.content = nabu.utils.elements.sanitize(self.$refs.editor ? self.$refs.editor.innerHTML : last);
			}, 100);
		}
	}
});
Vue.view("typography-h1", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "heading",
	description: "A level 1 header",
	name: "H1",
	category: "Typography",
	data: function() {
		return {
			tag: "h1",
			placeholder: "Heading 1"
		}
	}
});
Vue.view("typography-h2", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "heading",
	description: "A level 2 header",
	name: "H2",
	category: "Typography",
	data: function() {
		return {
			tag: "h2",
			placeholder: "Heading 2"
		}
	}
})
Vue.view("typography-h3", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "heading",
	description: "A level 3 header",
	name: "H3",
	category: "Typography",
	data: function() {
		return {
			tag: "h3",
			placeholder: "Heading 3"
		}
	}
})
Vue.view("typography-h4", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "heading",
	description: "A level 4 header",
	name: "H4",
	category: "Typography",
	data: function() {
		return {
			tag: "h4",
			placeholder: "Heading 4"
		}
	}
})
Vue.view("typography-h5", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "heading",
	description: "A level 5 header",
	name: "H5",
	category: "Typography",
	data: function() {
		return {
			tag: "h5",
			placeholder: "Heading 5"
		}
	}
})
Vue.view("typography-h6", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "heading",
	description: "A level 6 header",
	name: "H6",
	category: "Typography",
	data: function() {
		return {
			tag: "h6",
			placeholder: "Heading 6"
		}
	}
})
Vue.view("typography-paragraph", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "paragraph",
	description: "A paragraph of text",
	name: "Paragraph",
	category: "Typography",
	data: function() {
		return {
			tag: "p",
			placeholder: "Paragraph"
		}
	}
})

Vue.component("typography-blockquote-configure", {
	template: "#typography-template-configure",	
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	computed: {
		canHighlight: function() {
			return nabu.page.providers("page-format").filter(function(x) {
				 return x.name == "highlight";
			}).length > 0;
		}	
	},
	data: function() {
		return {
			highlightable: true
		}
	}
})
Vue.view("typography-blockquote", {
	template: "#typography-template",
	mixins: [Vue.component("typography-core")],
	icon: "quote-left",
	description: "A block quote",
	name: "Blockquote",
	category: "Typography",
	data: function() {
		return {
			tag: "blockquote",
			placeholder: "Blockquote",
			icon: false,
			highlightable: true
		}
	},
	methods: {
		configurator: function() {
			return "typography-blockquote-configure";
		}
	}
})


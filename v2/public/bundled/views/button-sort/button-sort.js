nabu.page.provide("page-renumberer", {
	component: "page-button-sort",
	renumber: function(target, mapping) {
		// update the action target
		if (target.state.actionTarget != null && mapping[target.state.actionTarget] != null) {
			target.state.actionTarget = mapping[target.state.actionTarget];	
		}
	}
});

Vue.view("page-button-sort", {
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
	name: "Sort Button",
	category: "Interactive",
	description: "A button that can be used to sort for example a repeat",
	icon: "link",
	data: function() {
		return {
			timer: null,
			running: false
		}
	},
	created: function() {
		this.elementPromise = this.$services.q.defer();
	},
	ready: function() {
		this.elementPromise.resolve(this.$el);
	},
	computed: {
		currentDirection: function() {
			
		},
		icon: function() {
			if (this.currentDirection == "asc") {
				return this.cell.state.iconAsc ? this.cell.state.iconAsc : "sort-up";
			}
			else if (this.currentDirection == "desc") {
				return this.cell.state.iconDesc ? this.cell.state.iconDesc : "sort-down";
			}
			if (this.cell.state.hideNoneIcon) {
				return null;
			}
			return this.cell.state.iconNone ? this.cell.state.iconNone : "sort";
		},
		active: function() {
			var active = false;
			if (this.cell.state.active) {
				active = this.$services.page.isCondition(this.cell.state.active, null, this);
			}
			return active || this.$services.triggerable.getActiveRoutes(this.cell.state).indexOf(this.$services.vue.route) >= 0;
		},
		disabled: function() {
			return this.cell.state.disabled && this.$services.page.isCondition(this.cell.state.disabled, null, this);
		}
	},
	methods: {
		getContentWithVariables: function(content) {
			var pageInstance = this.$services.page.getPageInstance(this.page, this);
			return !content ? content : this.$services.typography.replaceVariables(pageInstance, this.cell.state, content, this.elementPromise);
		},
		getChildComponents: function() {
			return [{
				title: "Sort Button",
				name: "page-button-sort",
				component: "button"
			}];
		},
		getEvents: function() {
			var result = {};
			nabu.utils.objects.merge(result, this.$services.triggerable.getEvents(this.page, this.cell.state));

			
			if (nabu.page.event.getName(this.cell.state, "clickEvent") && nabu.page.event.getName(this.cell.state, "clickEvent") != "$close") {
				var type = nabu.page.event.getType(this.cell.state, "clickEvent");
				result[nabu.page.event.getName(this.cell.state, "clickEvent")] = type;
			}
			if (this.cell.state.action && this.cell.state.actionTarget && this.cell.state.actionEvent) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				var output = this.$services.page.getActionOutput(pageInstance, this.cell.state.actionTarget, this.cell.state.action);
				// we may just want marker events without output
				result[this.cell.state.actionEvent] = output ? {properties:output} : {};
			}
			return result;
		},
		handle: function($event) {
			
		},
		configurator: function() {
			return "page-button-sort-configure";
		},
		update: function() {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			var self = this;
			if (this.$refs.editor) {
				var last = self.$refs.editor.innerHTML;
				this.timer = setTimeout(function() {
					self.cell.state.content = nabu.utils.elements.sanitize(self.$refs.editor ? self.$refs.editor.innerHTML : last);
				}, 100);
			}
		}
	}
});

Vue.component("page-button-sort-configure", {
	template: "#page-button-sort-configure",
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
	created: function() {
		// otherwise not reactive...?
		if (!this.cell.state.actionTarget) {
			Vue.set(this.cell.state, "actionTarget", null);
		}
	},
	methods: {
		getAvailableFields: function(value) {
			return [];
		}
	}
});
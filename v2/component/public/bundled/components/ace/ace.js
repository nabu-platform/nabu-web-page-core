Vue.component("n-form-ace", {
	template: "<div class='is-form-ace'>"
		+ "	<div class='is-label-wrapper' v-if='label'><label class='is-label' v-html='label'></label></div>"
		+ "	<div class='is-content-before' v-if='before' v-html='before'></div>"
		+ "	<div class='is-content-wrapper'>"
		+ "		<n-ace :mode='mode' :timeout='timeout' :value='value' v-bubble:input/>"
		+ "	</div>"
		+ "	<n-messages :messages='messages' v-if='messages && messages.length'/>"
		+ "	<div class='is-content-after' v-if='after' v-html='after'></div>"
		+ "</div>",
	props: {
		value: {
			required: true
		},
		label: {
			type: String,
			required: false
		},
		mode: {
			type: String,
			required: false,
			default: "scss"
		},
		timeout: {
			type: Number,
			required: false,
			default: 300
		},
		before: {
			type: String,
			required: false
		},
		after: {
			type: String,
			required: false
		}
	},
	data: function() {
		return {
			messages: []
		}
	}
});
Vue.component("n-ace", {
	template: "<div class='n-ace'></div>",
	props: {
		value: {
			required: true
		},
		mode: {
			type: String,
			required: false,
			default: "scss"
		},
		timeout: {
			type: Number,
			required: false,
			default: 300
		}
	},
	data: function() {
		return {
			editor: null,
			timer: null
		}
	},
	ready: function() {
		ace.require("ace/ext/language_tools");
		this.editor = ace.edit(this.$el);
		this.editor.setOptions({
			enableBasicAutocompletion: true,
			enableSnippets: true,
			enableLiveAutocompletion: true,
			useSoftTabs: false,
			showInvisibles: false,
			scrollPastEnd: false,
			enableEmmet: false,
			// default scroll speed is _very_ fast for some reason
			scrollSpeed: 0.5,
			tabSize: 4
		});
		//this.editor.setTheme("ace/theme/monokai");
		var self = this;
		this.editor.getSession().on('change', function() {
			if (self.timer) {
				clearTimeout(self.timer);
				self.timer = null;
			}
			self.$emit("change", self.editor.getSession().getValue());
			if (self.timeout) {
				self.timer = setTimeout(function() {
					self.$emit("input", self.editor.getSession().getValue());
				}, self.timeout);
			}
			else {
				self.$emit("input", value);
			}
		});
		if (this.value) {
			// the -1 moves cursor to the start, if we use 1 it moves to the end
			this.editor.setValue(this.value, -1);
		}
		this.setMode(this.mode);
	},
	methods: {
		setMode: function(mode) {
			this.editor.getSession().setMode("ace/mode/" + mode);
		},
		insert: function(text) {
			this.editor.insert(text);
		}
	},
	watch: {
		mode: function(newValue) {
			this.editor.getSession().setMode("ace/mode/" + mode);
		}
	}
});
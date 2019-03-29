if (!nabu) { var nabu = {} }
if (!nabu.page) { nabu.page = {} }
if (!nabu.page.views) { nabu.page.views = {} }

nabu.page.views.Youtube = Vue.extend({
	template: "#page-youtube",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
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
		},
		localState: {
			type: Object,
			required: false
		}
	},
	data: function() {
		return {
			configuring: false
		}
	},
	computed: {
		url: function() {
			if (this.cell.state.url) {
				// examples:
				// main site: https://www.youtube.com/watch?v=bmLCj8Qba-M&t=553s
				// shorter: https://youtu.be/o0nar1v3jmU
				// already embedded: https://www.youtube.com/embed/bmLCj8Qba-M
				var url = this.cell.state.url;
				var code = null;
				if (url.match(/\\?v=/)) {
					code = url.replace(/^.*\\?v=([^&]+).*/, "$1");
				}
				else if (url.match(/youtu\\.be/)) {
					code = url.replace(/^.*youtu\\.be\/(.*)+/, "$1");
				}
				if (code != null) {
					url = "https://www.youtube.com/embed/" + code;
				}
				if (this.cell.state.hideControls) {
					url += "?controls=0";
				}
				console.log("youtube", url, code);
				return url;
			}
			return null;
		}	
	},
	methods: {
		configure: function() {
			this.configuring = true;	
		}
	}
})
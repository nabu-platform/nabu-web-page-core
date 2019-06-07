Vue.component("n-reveal-page-content", {
	template: "#n-reveal-page-content",
	props: {
		edit: {
			type: Boolean,
			required: false
		}
	}
});

Vue.component("n-reveal-row", {
	template: "#n-reveal-row"
});

Vue.component("n-reveal-page", {
	template: "#n-reveal-page",
	props: {
		edit: {
			type: Boolean,
			required: false
		}
	},
	ready: function() {
		console.log("editing", this.edit);
		if (!this.edit) {
			/*this.$services.page.inject("https://raw.githubusercontent.com/hakimel/reveal.js/master/js/reveal.js", function() {
				Reveal.initialize();
			});*/
			Reveal.initialize({
				controls: true,
				progress: true,
				hash: true,
				// use default or nothing to have up/down functionality as well
				// https://github.com/hakimel/reveal.js/#navigation-mode
				navigationMode: "linear"
			});
		}
	}
});

Vue.component("n-reveal-cell", {
	template: "#n-reveal-cell",
	ready: function() {
		this.$el.querySelectorAll(".fragment-list li").forEach(function(li) {
			li.classList.add("fragment");
		});
		this.$el.querySelectorAll(".notes").forEach(function(child) {
			child.parentNode.removeChild(child);
		});
	}
});

window.addEventListener("load", function() {
	application.bootstrap(function($services) {
		nabu.page.provide("page-type", {
			name: "slides",
			pageTag: "n-reveal-page",
			pageContentTag: "n-reveal-page-content",
			rowTag: function(row, depth, edit) {
				return edit || depth > 0 ? "div" : "section";
			},
			cellTag: function(row, cell, depth, edit) {
				return edit || depth > 0 ? "div" : "n-reveal-cell";
			},
			pageTagEdit: "div",
			pageContentTagEdit: "div"
		});
	});
});
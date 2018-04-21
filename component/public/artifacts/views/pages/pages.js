if (!nabu) { var nabu = {} }
if (!nabu.views) { nabu.views = {} }
if (!nabu.views.cms) { nabu.views.cms = {} }

nabu.views.cms.Pages = Vue.extend({
	template: "#nabu-cms-pages",
	methods: {
		create: function() {
			var name = prompt("Name");
			var self = this;
			if (name) {
				this.$services.page.create(name);
			}
		}
	}
});
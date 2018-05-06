window.addEventListener("load", function() {
	application.bootstrap(function($services) {
		
		$services.router.register({
			alias: "pages",
			enter: function(parameters) {
				return new nabu.views.cms.Pages({propsData:parameters});
			},
			url: "/pages",
			actions: ["page.admin"]
		});
		
		$services.router.register({
			alias: "pages",
			enter: function(parameters) {
				return new nabu.views.cms.Pages({propsData:parameters});
			},
			priority: -5,
			url: "/",
			actions: ["page.admin"]
		});
		
		$services.router.register({
			alias: "page-static-image",
			enter: function(parameters) {
				return new nabu.views.page.Image({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-richtext",
			enter: function(parameters) {
				return new nabu.views.page.Richtext({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-fields",
			enter: function(parameters) {
				return new nabu.views.cms.PageFields({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-actions",
			enter: function(parameters) {
				return new nabu.views.cms.PageActions({propsData: parameters});
			}
		});
		
		return $services.$register({
			page: nabu.services.Page
		});
	});
});
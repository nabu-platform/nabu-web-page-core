window.addEventListener("load", function() {
	application.bootstrap(function($services) {
		
		$services.router.register({
			alias: "pages",
			enter: function(parameters) {
				return new nabu.views.cms.Pages({propsData:parameters});
			},
			url: "/pages"
		});
		
		$services.router.register({
			alias: "pages",
			enter: function(parameters) {
				return new nabu.views.cms.Pages({propsData:parameters});
			},
			priority: -5,
			url: "/"
		});
		
		$services.router.register({
			alias: "page-image",
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
		
		return $services.$register({
			page: nabu.services.cms.Page
		});
	});
});
window.addEventListener("load", function() {
	application.bootstrap(function($services) {
		
		$services.router.register({
			alias: "cms-pages",
			enter: function(parameters) {
				return new nabu.views.cms.Pages({propsData:parameters});
			},
			url: "/pages"
		});
		
		return $services.$register({
			page: nabu.services.cms.Page
		});
	});
});
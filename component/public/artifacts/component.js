window.addEventListener("load", function() {
	application.bootstrap(function($services) {
		
		$services.router.register({
			alias: "pages",
			enter: function(parameters) {
				return new nabu.page.views.Pages({propsData:parameters});
			},
			url: "/pages"
		});
		
		$services.router.register({
			alias: "pages",
			enter: function(parameters) {
				return new nabu.page.views.Pages({propsData:parameters});
			},
			priority: -5,
			url: "/"
		});
		
		$services.router.register({
			alias: "page-static-image",
			query: ["href"],
			enter: function(parameters) {
				return new nabu.page.views.Image({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-richtext",
			enter: function(parameters) {
				return new nabu.page.views.Richtext({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-fields",
			enter: function(parameters) {
				return new nabu.page.views.PageFields({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-actions",
			enter: function(parameters) {
				return new nabu.page.views.PageActions({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-form",
			enter: function(parameters) {
				return new nabu.page.views.PageForm({propsData: parameters});
			}
		});
		
		// fragment providers
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-data", 
			configure: "page-field-fragment-data-configure", 
			name: "data" 
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-text", 
			configure: "page-field-fragment-text-configure", 
			name: "text" 
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-image", 
			configure: "page-field-fragment-image-configure", 
			name: "image" 
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-richtext", 
			configure: "page-field-fragment-richtext-configure", 
			name: "richtext" 
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-form", 
			configure: "page-field-fragment-form-configure", 
			name: "form",
			editable: true
		});
		
		// form providers
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-richtext", 
			configure: "page-form-input-richtext-configure", 
			name: "richtext" 
		});
		
		return $services.$register({
			page: nabu.page.services.Page,
			formatter: nabu.page.services.Formatter
		});
	});
	
});
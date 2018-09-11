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
			name: "data",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-text", 
			configure: "page-field-fragment-text-configure", 
			name: "text",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-image", 
			configure: "page-field-fragment-image-configure", 
			name: "image",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-richtext", 
			configure: "page-field-fragment-richtext-configure", 
			name: "richtext",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-javascript", 
			configure: "page-field-fragment-javascript-configure", 
			name: "javascript",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-field-fragment", { 
			component: "page-field-fragment-form", 
			configure: "page-field-fragment-form-configure", 
			name: "form",
			editable: true,
			namespace: "nabu.page"
		});
		
		// form providers
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-richtext", 
			configure: "page-form-input-richtext-configure", 
			name: "richtext",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-page", 
			configure: "page-form-input-page-configure", 
			name: "page",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-text", 
			configure: "page-form-input-text-configure", 
			name: "text",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-slider", 
			configure: "page-form-input-slider-configure", 
			name: "slider",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-date", 
			configure: "page-form-input-date-configure", 
			name: "date",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-switch", 
			configure: "page-form-input-switch-configure", 
			name: "switch",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-checkbox", 
			configure: "page-form-input-checkbox-configure", 
			name: "checkbox",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-enumeration", 
			configure: "page-form-input-enumeration-configure", 
			name: "enumeration",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-enumeration-provider", 
			configure: "page-form-input-enumeration-provider-configure", 
			name: "enumeration-provider",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-enumeration-operation", 
			configure: "page-form-input-enumeration-operation-configure", 
			name: "enumeration-operation",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-static-image", 
			configure: "page-form-input-static-image-configure", 
			name: "static-image",
			namespace: "nabu.page"
		});
		
		// form list providers
		nabu.page.provide("page-form-list-input", { 
			component: "page-form-list-input-dynamic", 
			configure: "page-form-list-input-dynamic-configure", 
			name: "dynamic",
			namespace: "nabu.page"
		});
		
		// formatters
		nabu.page.provide("page-format", {
			format: function(id, fragment) {
				var result = $services.pageResolver.resolve(fragment.resolveOperation, fragment.resolveOperationIds, fragment.resolveOperationId, id);
				return result && fragment.resolveOperationLabel ? result[fragment.resolveOperationLabel] : result;
			},
			configure: "page-format-resolver",
			name: "resolve",
			namespace: "nabu.cms"
		});
		
		nabu.page.provide("page-format", {
			format: function(value) {
				try {
					var page = new nabu.page.views.Page({
						propsData: {
							embedded: true,
							page: {
								name: "dynamic-page-" + application.services.page.counter++,
								content: application.services.page.normalize(value ? JSON.parse(value) : {})
							}
						}
					});
					return page.$mount().$el;
				}
				catch (exception) {
					return null;
				}
			},
			html: true,
			skipCompile: true,
			name: "page",
			namespace: "nabu.cms"
		});
		
		return $services.$register({
			page: nabu.page.services.Page,
			pageResolver: nabu.page.services.PageResolver,
			resizer: nabu.page.services.Resizer,
			formatter: nabu.page.services.Formatter
		});
	});
	
});
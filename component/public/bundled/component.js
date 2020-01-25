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
			},
			icon: "page/core/images/richtext.svg",
			description: "The rich text component can be used to write static texts with markup",
			name: "Rich Text",
			category: "Content",
		});
		
		$services.router.register({
			alias: "page-markdown",
			enter: function(parameters) {
				return new nabu.page.views.Markdown({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-code",
			enter: function(parameters) {
				return new nabu.page.views.Code({propsData: parameters});
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
			},
			icon: "page/core/images/buttons.svg",
			description: "The buttons component can be used to create anything from tabs to actual buttons",
			name: "Buttons",
			category: "Interactive",
			query: ["active"]
		});
		
		$services.router.register({
			alias: "page-form",
			enter: function(parameters) {
				return new nabu.page.views.PageForm({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-youtube",
			enter: function(parameters) {
				return new nabu.page.views.Youtube({propsData: parameters});
			}
		});
		
		$services.router.register({
			alias: "page-skeleton-email",
			enter: function(parameters) {
				return new nabu.page.skeletons.Email({propsData: parameters});
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
			component: "page-form-input-password", 
			configure: "page-form-input-password-configure", 
			name: "password",
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
			component: "page-form-input-date-picker", 
			configure: "page-form-input-date-picker-configure", 
			name: "date-picker",
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
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-file", 
			configure: "page-form-input-file-configure", 
			name: "file",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-location", 
			configure: "page-form-input-location-configure", 
			name: "location",
			namespace: "google",
			multipleFields: true
		});
		nabu.page.provide("page-form-input", { 
			component: "page-form-input-address", 
			configure: "page-form-input-address-configure", 
			name: "address",
			namespace: "google",
			multipleFields: true
		});
		
		// form list providers
		nabu.page.provide("page-form-list-input", { 
			component: "page-form-list-input-dynamic", 
			configure: "page-form-list-input-dynamic-configure", 
			name: "dynamic",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-list-input", { 
			component: "page-form-list-input-predefined", 
			configure: "page-form-list-input-predefined-configure", 
			name: "predefined",
			namespace: "nabu.page"
		});
		
		// renderers
		nabu.page.provide("page-renderer", {
			name: "slider",
			component: "page-renderer-slider",
			type: "row",
			properties: ["group", "tag"]
		});
		
		nabu.page.provide("page-type", {
			name: "email",
			pageTag: "e-root",
			rowTag: "e-row",
			cellTag: "e-columns"
		});
		
		nabu.page.provide("page-icon", {
			name: "Font Awesome",
			html: function(icon) {
				return "<span class='icon fa " + icon + "'></span>";
			},
			priority: -1,
			allowOther: true,
			icons: []
		});
		
		// formatters
		nabu.page.provide("page-format", {
			format: function(id, fragment, page, cell) {
				var properties = null;
				var self = this;
				var pageInstance = $services.page.getPageInstance(page, this);
				if (fragment && fragment.resolveOperationBinding) {
					properties = {};
					Object.keys(fragment.resolveOperationBinding).map(function(key) {
						if (fragment.resolveOperationBinding[key]) {
							var bindingValue = $services.page.getBindingValue(pageInstance, fragment.resolveOperationBinding[key]);
							properties[key] = bindingValue;
						}
					});
				}
				var result = $services.pageResolver.resolve(fragment.resolveOperation, fragment.resolveOperationIds, fragment.resolveOperationId, id, properties);
				// the content is not there yet at time of serialization, need to update when it is...
				// put the resulting string in watched storage, use updated in the component to redo the string!
				if (result && fragment.resolveOperationLabelComplex) {
					
					var storageId = "resolve." + JSON.stringify(fragment) + "." + fragment.resolveOperation + "." + id;
					storageId = storageId.replace(/\./g, "_");
					// always check to prevent unending loops
					if (pageInstance.retrieve(storageId) != null) {
						return pageInstance.retrieve(storageId);
					}
					pageInstance.store(storageId, "");
					
					// not sure why, but need to take it out of the synchronous execution...
					setTimeout(function() {
						var updateFunction = function() {
							if (pageInstance.retrieve(storageId) != component.$el.innerHTML) {
								pageInstance.store(storageId, component.$el.innerHTML);
							}
						};
						var component = new nabu.page.views.PageFields({ propsData: {
							page: nabu.utils.objects.deepClone(page),
							cell: nabu.utils.objects.deepClone({state:fragment}),
							edit: false,
							data: result,
							label: false,
							fieldsName: "resolveFields"
						}, updated: updateFunction, ready: updateFunction });
						component.$mount();
					}, 1);
					
					return pageInstance.retrieve(storageId);
				}
				else {
					return result && fragment.resolveOperationLabel ? result[fragment.resolveOperationLabel] : result;
				}
			},
			skipCompile: true,
			html: true,
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
		
		var blocksToHighlight = [];
		var highlightFormatter = function(value, syntax) {
			if ($services.vue.$highlightCounter == null) {
				$services.vue.$highlightCounter = 1;
			}
			var id = "format_highlight_" + $services.vue.$highlightCounter++;
			var clazz = syntax ? " class='" + syntax + "'" : "";
			var result = value == null ? null :
				"<pre id='" + id + "'" + clazz + "><code>" + value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</code></pre>";
				
			setTimeout(function() {
				if (!$services.vue.$highlightLoaded) {
					$services.vue.$highlightLoaded = [];
				}
				var loaded = $services.vue.$highlightLoaded;
				
				var highlight = function(id) {
					hljs.highlightBlock(document.getElementById(id));
				}
				
				if (!window.hljs) {
					blocksToHighlight.push(id);
					if (loaded.indexOf("$main") < 0) {
						loaded.push("$main");
						var script = document.createElement("script");
						script.setAttribute("type", "text/javascript");
						script.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/highlight.min.js");
						document.head.appendChild(script);
						script.onload = function() {
							blocksToHighlight.forEach(highlight);
						}
						var link = document.createElement("link");
						link.rel = "stylesheet";
						link.href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/styles/default.min.css";
						document.head.appendChild(link);
					}
				}
				else {
					highlight(id);
				}
			}, 1);
			
			return result;
		};
		nabu.page.provide("page-format", {
			format: highlightFormatter,
			html: true,
			skipCompile: true,
			name: "highlight",
			namespace: "nabu.cms"
		});
		
		var markdownToParse = [];
		nabu.page.provide("page-format", {
			format: function(value) {
				if ($services.vue.$highlightCounter == null) {
					$services.vue.$highlightCounter = 1;
				}
				var id = "format_markdown_" + $services.vue.$highlightCounter++;
				var result = value == null ? null : "<div id='" + id + "'>" + value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>";
				var compile = function(id) {
					var converter = new showdown.Converter();
					converter.setFlavor('github');
					var part = document.getElementById(id);
					if (part) {
						part.innerHTML = nabu.utils.elements.sanitize(converter.makeHtml(part.innerHTML)).replace(/&amp;lt;/g, "&lt;").replace(/&amp;gt;/g, "&gt;");
					}
				};
				setTimeout(function() {
					if (!window.showdown) {
						markdownToParse.push(id);
						if (!$services.vue.$markdownLoaded) {
							$services.vue.$markdownLoaded = true;
							var script = document.createElement("script");
							script.setAttribute("type", "text/javascript");
							script.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.0/showdown.min.js");
							document.head.appendChild(script);
							script.onload = function() {
								markdownToParse.forEach(compile);
							}
						}
					}
					else {
						compile(id);
					}
				}, 1);
				
				return result;
			},
			html: true,
			skipCompile: true,
			name: "markdown",
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
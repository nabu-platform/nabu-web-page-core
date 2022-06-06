<template id="nabu-page">
	<component :edit="edit" :is="pageTag()" :inline-all="true" class="is-page" :class="classes" :body-class="bodyClasses" :page="page.name" 
			@drop="dropMenu($event)" @dragover="dragOver($event)">
		<div class="is-page-edit-menu" v-if="!page.content.readOnly && $services.page.canEdit() && $services.page.wantEdit && !embedded && !$services.page.editing" 
				:draggable="true" 
				@dragstart="dragMenu($event)"
				:class="{'is-bookmarkable': !!page.content.path}"
				:style="{'top': page.content.menuY ? page.content.menuY + 'px' : '0px', 'left': page.content.menuX ? page.content.menuX + 'px' : '0px'}">
			<span>{{page.name}}</span>
			<button class="is-button is-variant-ghost is-size-xsmall" v-if="page.content.path && hasConfigureListener()" @click="triggerConfiguration()"><icon name="cog"/></button>
			<button class="is-button is-variant-ghost is-size-xsmall" @click="goIntoEdit"><icon name="pencil-alt"/></button>
			<button class="is-button is-variant-ghost is-size-xsmall" @click="$services.router.route('pages')"><icon name="copy"/></button>
			<button v-if="page.content.path && $services.language && $services.language.available.length" class="is-button language-selector is-variant-ghost">
				<span class="current">{{hasLanguageSet() ? $services.language.current.name : "none"}}</span>
				<div class="options">
					<span v-for="language in $services.language.available" @click="$services.language.current = language">{{language.name}}</span>
					<span v-if="$services.language.current && ${environment('development')}" @click="$services.language.current = null">unset</span>
				</div>
			</button>
			<button class="is-button is-variant-ghost is-size-xsmall" @click="$window.console.log('Page: ' + page.name, $self.variables, $self)"><icon name="terminal"/></button>
			<button class="is-button is-variant-ghost is-size-xsmall" v-if="$services.page.disableReload" @click="$services.page.disableReload = false"><icon name="sync"/></button>
			<button class="is-button is-variant-ghost is-size-xsmall" v-else @click="$services.page.disableReload = true"><icon name="ban"/></button>
		</div>
		
		<n-sidebar v-if="edit && page.content.rows" position="left" class="is-size-large is-header-size-large" :inline="true" :autocloseable="false" ref="sidemenu"
				@close="stopEdit">
			<div class="is-column is-spacing-medium is-align-left is-spacing-vertical-gap-small" slot="header">
				<h3 class="is-h3 is-color-neutral">
					<div class="is-row is-spacing-horizontal-gap-medium is-align-center">
						{{page.content.label ? page.content.label : page.content.name}}
						<ul class="is-menu is-variant-toolbar">
							<li class="is-column"><button class="is-button is-variant-primary-outline is-size-xsmall" @click="save"><span class="is-text">Save</span></button></li>
						</ul>
					</div>
				</h3>
				<p class="is-p is-color-light is-size-xsmall">Last saved: {{saved ? $services.formatter.date(saved, 'HH:mm:ss') : 'never' }}</p>
				<ul class="is-menu is-variant-toolbar">
					<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-small is-border-underline" @click="activeTab = 'layout'" :class="{'is-active': activeTab == 'layout'}"><icon name="align-left"/><span class="is-text">Layout</span></button></li>
					<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-small is-border-underline" @click="activeTab = 'settings'" :class="{'is-active': activeTab == 'settings'}"><icon name="cog"/><span class="is-text">Settings</span></button></li>
					<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-small is-border-underline" @click="activeTab = 'components'" :class="{'is-active': activeTab == 'components'}"><icon name="cubes"/><span class="is-text">Content</span></button></li>
					<li class="is-column" v-if="cell || row"><button class="is-button is-variant-primary-outline is-size-small is-border-underline" @click="activeTab = 'selected'" :class="{'is-active': activeTab == 'selected'}"><icon name="cube"/>
						<span class="is-text" v-if="selectedType == 'cell' && cell && cell.name">{{cell.name}}</span>
						<span class="is-text" v-else-if="selectedType == 'cell' && cell && cell.alias">{{$services.page.prettifyRouteAlias(cell.alias)}}</span>
						<span class="is-text" v-else-if="selectedType == 'row' && row && row.name">{{row.name}}</span>
						<span class="is-text" v-else>Selected {{selectedType == 'cell' ? "cell" : "row"}}</span></button>
					</li>
				</ul>
			</div>
			<div>
				<ul class="is-menu is-variant-toolbar is-align-center is-spacing-medium" v-if="false">
					<li class="is-column"><button class="is-button is-variant-success is-size-small" @click="configuring = true"><icon name="cog"/><span class="is-text">Configure</span></button></li>
					<li class="is-column"><button class="is-button is-variant-success-outline is-size-small" @click="addRow(page.content)"><icon name="plus"/><span class="is-text">Row</span></button></li>
					<li class="is-column"><button class="is-button is-variant-warning is-size-small" @click="pasteRow" v-if="$services.page.copiedRow"><icon name="paste"/></button></li>
					<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-small" @click="viewComponents = true"><icon name="cubes"/><span class="is-text">Components</span></button></li>
					<li class="is-column"><button class="is-button is-variant-primary is-size-small" v-if="!embedded" @click="save"><icon name="save"/><span class="is-text">Save</span></button></li>
				</ul>
				
				<div v-show="edit && page.content.rows && activeTab  == 'layout'">
					<page-sidemenu :rows="page.content.rows" :page="page"
						:selected="cell ? cell : row"
						@select="selectItem"
						@removeRow="function(row) { $confirm({title: 'Delete row', message:'Are you sure you want to delete this row?'}).then(function() { page.content.rows.splice(page.content.rows.indexOf(row), 1) }) }"/>
					<ul class="is-menu is-variant-toolbar is-align-end is-spacing-vertical-medium is-spacing-horizontal-right-small">
						<li class="is-column" v-if="$services.page.copiedRow"><button class="is-button is-variant-warning is-size-xsmall" @click="pasteRow()"><icon name="paste"/><span class="is-text">Paste copied row</span></button></li>
						<li class="is-column"><button class="is-button is-variant-primary is-size-xsmall" @click="addRow(page.content)"><icon name="plus"/><span class="is-text">New row</span></button></li>
					</ul>
				</div>
				<div v-if="activeTab == 'settings'">
					<n-form class="is-variant-floating-labels">
						<div class="is-column is-spacing-vertical-gap-medium">
							<hr class="is-line is-size-large is-color-primary-light"/>
							<h2 class="is-h4 is-spacing-medium is-color-primary-outline">Page Settings</h2>
							<div class="is-accordion is-highlight-left">
								<n-collapsible :only-one-open="true" title="Routing" content-class="is-spacing-medium">
									<p class="is-p is-size-small is-color-light">These settings will determine how the page is routed throughout the application.</p>
									<n-form-text v-model="page.content.category" label="Category" info="The category this page belongs to"/>
									<n-form-text v-model="page.content.path" label="Path" info="The path this page can be found on, if you don't want to expose it via a dedicated path, leave this empty.<br/><br/> You can use the following syntax to define path variables:<br/>/path/to/{myVariable}/is"/>
									<n-form-text v-model="page.content.title" label="Title" info="You can fill in a custom application title that will appear when this page is routed"/>
									<n-form-combo label="Page Parent" :filter="$services.page.getParentRoutes" v-model="page.content.pageParent"
										empty-value="No available parents"/>
									<n-form-text v-model="page.content.defaultAnchor" label="Content Anchor"
										after="Choose the parent page in which this page is nested by default when the user browses to it"/>
									<n-form-text v-model="page.content.autoRefresh" label="Auto-refresh"/>
									<n-form-switch label="Is slow" v-if="!page.content.initial" v-model="page.content.slow" after="If the route is slow, we can render a loading icon"/>
									<n-form-switch label="Route Error in Self" v-model="page.content.errorInSelf" after="If you check this, the error page will be routed in the element that this page appears in"/>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Style" content-class="is-spacing-medium">
									<h5 class="is-h5">Page style</h5>
									<p class="is-p is-size-small is-color-light">These settings will influence how the page is rendered.</p>
									<n-form-combo label="Page Type" :filter="getPageTypes" v-model="page.content.pageType" info = "The page type determines how the page is rendered. For example an email requires different rendering from a webpage."/>
									<n-form-text v-model="page.content.class" label="CSS Class" info = "The main css class for this page" :timeout="600"/>
									<div class="is-row is-align-end">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="page.content.styles == null ? $window.Vue.set(page.content, 'styles', [{class:null,condition:null}]) : page.content.styles.push({class:null,condition:null})"><icon name="plus"/>Page style</button>
									</div>
									
									<div v-if="page.content.styles" class="is-column is-spacing-vertical-gap-medium">
										<n-form v-for="style in page.content.styles" class="has-button-close is-spacing-medium is-color-body">
											<n-form-section class="is-column is-spacing-vertical-small">
												<n-form-text v-model="style.class" label="CSS Class" :timeout="600" class="is-size-small"/>
												<n-form-text v-model="style.condition" label="Condition" :timeout="600" class="is-size-small"/>
												<button @click="page.content.styles.splice(page.content.styles.indexOf(style), 1)" class="is-button is-variant-close is-size-small"><icon name="times"/></button>
											</n-form-section>
										</n-form>
									</div>
									
									<h5 class="is-h5">Body style</h5>
									<p class="is-p is-size-small is-color-light">You can add classes to the body when this page is rendered.</p>
									
									<div class="is-row is-align-end">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="page.content.bodyStyles == null ? $window.Vue.set(page.content, 'bodyStyles', [{class:null,condition:null}]) : page.content.bodyStyles.push({class:null,condition:null})"><icon name="plus"/>Body style</button>
									</div>
									
									<div v-if="page.content.bodyStyles" class="is-column is-spacing-vertical-gap-medium">
										<n-form v-for="style in page.content.bodyStyles" class="has-button-close is-spacing-medium is-color-body">
											<n-form-section class="is-column is-spacing-vertical-small">
												<n-form-text v-model="style.class" label="CSS Class" class="is-size-small"/>
												<n-form-text v-model="style.condition" label="Condition" class="is-size-small"/>
												<button @click="page.content.bodyStyles.splice(page.content.bodyStyles.indexOf(style), 1)" class="is-button is-variant-close is-size-small"><icon name="times"/></button>
											</n-form-section>
										</n-form>
									</div>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Security" content-class="is-spacing-medium">
									<p class="is-p is-size-small is-color-light">You can configure additional security on a page to limit access. If nothing is configured, everyone is allowed. You can use pseudo roles like $user and $guest.</p>
									
									<div class="is-row is-align-end">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="page.content.roles ? page.content.roles.push('') : $window.Vue.set(page.content, 'roles', [''])"><icon name="plus"/>Role</button>
									</div>
									<div v-if="page.content.roles">
										<div v-for="i in Object.keys(page.content.roles)" class="has-button-close">
											<n-form-text v-model="page.content.roles[i]" placeholder="Role e.g. $user, $guest, ..." :timeout="600"/>
											<button class="is-button is-variant-close is-size-small" @click="page.content.roles.splice(i, 1)"><icon name="times"/></button>
										</div>
									</div>
									
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Branding" content-class="is-spacing-medium">
									<div class="is-row is-align-end" v-if="!page.content.branding">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="$window.Vue.set(page.content, 'branding', {})">Enable Page Branding</button>
									</div>
									<div v-else class="is-column is-spacing-vertical-gap-medium">
										<div class="is-row is-align-end">
											<button class="is-button is-variant-danger-outline is-size-xsmall" @click="$window.Vue.set(page.content, 'branding', null)">Disable Page Branding</button>
										</div>
										<n-form-text v-model="page.content.branding.favicon" placeholder="/resources/images/logo.png" label="The location of the favicon" :timeout="600" @input="$services.page.saveConfiguration"/>
										<n-form-text v-model="page.content.branding.title" :placeholder="$services.page.title" label="The meta title for your application" :timeout="600" @input="$services.page.saveConfiguration"/>
										<n-form-text v-model="page.content.branding.description" label="The meta description for your application" :timeout="600" @input="$services.page.saveConfiguration"/>
										<n-form-text v-model="page.content.branding.image" placeholder="/resources/images/hero.png" label="The meta image for your application" info="Minimum 1200×630 pixels, max 1mb" :timeout="600" @input="$services.page.saveConfiguration"/>
										<n-form-text v-model="page.content.branding.imageAlt" label="Alternative text for your main image" :timeout="600" @input="$services.page.saveConfiguration"/>
										<n-form-text v-model="page.content.branding.facebookAppId" label="Your facebook app id" info="Mostly interesting for analytics" placeholder="your_app_id" :timeout="600" @input="$services.page.saveConfiguration"/>
										<n-form-text v-model="page.content.branding.twitterUserName" placeholder="@website-username" info="Mostly interesting for analytics" label="Your facebook app id" :timeout="600" @input="$services.page.saveConfiguration"/>
									</div>
								</n-collapsible>
							</div>
							
							<hr class="is-line is-size-large is-color-primary-light"/>
							<h2 class="is-h4 is-spacing-medium is-color-primary-outline">Variables</h2>
							<p class="is-p is-size-small is-color-light is-spacing-medium">Variables allow you to use dynamic content in your page. All variable names must follow the Nabu naming conventions.</p>
							<div class="is-accordion is-highlight-left">
								<n-collapsible :only-one-open="true" title="Path" content-class="is-spacing-medium">
									<p class="is-p is-size-small is-color-light">Path variables can be defined in the 'path' under 'General Settings'. Use {} syntax to denote variable parts. Path variables are bookmarkable.</p>
									<p class="is-p is-size-small is-color-danger-outline" v-if="!$services.page.pathParameters(page.content.path).length">No variables found in the current path.</p>
									<p class="is-p is-size-small is-color-success-outline" v-else>Found the following path variables: {{$services.page.pathParameters(page.content.path).join(", ")}}</p>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Query" content-class="is-spacing-medium">
									<p class="is-p is-size-small is-color-light">You can use query variables to feed input values to your page from another page or another application. Query variables are bookmarkable.</p>
									<div class="is-row is-align-end">
										<button class="is-button is-color-primary-outline is-size-xsmall" @click="page.content.query.push(null)"><icon name="plus"/>New query parameter</button>
									</div>
									<div v-if="page.content.query && page.content.query.length">
										<div v-for="i in Object.keys(page.content.query)" class="has-button-close">
											<n-form-text v-model="page.content.query[i]" :timeout="600" placeholder="Name of the parameter"/>
											<button @click="removeQuery(i)" class="is-button is-variant-close is-size-small"><icon name="times"/></button>
										</div>
									</div>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Internal">
									<div class="is-column is-spacing-medium">
										<p class="is-p is-size-small is-color-light">You can use internal variables to store data that you capture.</p>
										<div class="is-row is-align-end">
											<button class="is-button is-color-primary-outline is-size-xsmall" @click="addPageParameter"><icon name="plus"/>New internal parameter</button>
										</div>
									</div>
									<div class="is-accordion" v-if="page.content.parameters">
										<n-collapsible :only-one-open="true" class="is-color-primary-light" v-for="parameter in page.content.parameters" :title="parameter.name ? parameter.name : 'unnamed'" content-class="is-spacing-medium" after="Internal">
											<ul slot="buttons" class="is-menu is-variant-toolbar is-spacing-horizontal-right-small">
												<li class="is-column"><button class="is-button is-size-xsmall is-variant-primary-outline" @click="moveInternalUp(parameter)"><icon name="chevron-circle-up"/></button></li>
												<li class="is-column"><button class="is-button is-size-xsmall is-variant-primary-outline" @click="moveInternalDown(parameter)"><icon name="chevron-circle-down"/></button></li>
												<li class="is-column"><button class="is-button is-size-xsmall is-variant-danger-outline" @click="page.content.parameters.splice(page.content.parameters.indexOf(parameter), 1)"><icon name="times"/></button></li>
											</ul>
											<n-form-text v-model="parameter.name" :required="true" label="Name" :timeout="600"/>
											<n-form-combo v-model="parameter.type" label="Type" :nillable="false" :filter="getParameterTypes"/>
											<n-form-combo v-model="parameter.format" label="Format" v-if="parameter.type == 'string'" :items="['date-time', 'uuid', 'uri', 'date', 'password']"/>
											<n-form-text v-model="parameter.default" label="Default Value" v-if="!parameter.complexDefault && (!parameter.defaults || !parameter.defaults.length)"/>
											<n-form-ace mode="javascript" v-model="parameter.defaultScript" label="Default Value" v-if="parameter.complexDefault && (!parameter.defaults || !parameter.defaults.length)"/>
											<n-form-switch v-model="parameter.complexDefault" label="Use script for default value"/>
											
											<div v-if="parameter.type && parameter.type.indexOf('.') > 0 && !parameter.default">
												<h4 class="is-h4">Default Values</h4>
												<p class="is-p is-size-small is-color-light">You can set separate default values for particular fields.</p>
												<div class="is-row is-align-end">
													<button @click="parameter.defaults ? parameter.defaults.push({query:null,value:null}) : $window.Vue.set(parameter, 'defaults', [{query:null,value:null}])"><icon name="plus"/>Default Value</button>
												</div>
												<div v-if="parameter.defaults">
													<n-form-section class="is-column is-spacing-medium has-button-close is-color-body" v-for="defaultValue in parameter.defaults">
														<n-form-combo v-model="defaultValue.query" placeholder="Query" :filter="listFields.bind($self, parameter.type)"/>
														<n-form-text v-model="defaultValue.value" placeholder='Value'/>
														<button class="is-button is-variant-close is-size-small" @click="parameter.defaults.splice(parameter.defaults.indexOf(defaultValue), 1)"><icon name="times"/></button>
													</n-form-section>
												</div>
											</div>
											<n-form-switch v-if="false" v-model="parameter.global" label="Is translation global?"/>
											<h4 class="is-h4">Update Listener</h4>
											<p class="is-p is-size-small is-color-light">Whenever an event is emitted, you can capture a value from it by configuring an update listener.</p>
											<div class="is-row is-align-end">
												<button class="is-button is-variant-primary-outline is-size-xsmall" @click="parameter.listeners.push({to:null, field: null})"><icon name="plus"/>Update Listener</button>
											</div>
											<div class="list-row" v-for="i in Object.keys(parameter.listeners)" class="is-row has-button-close is-spacing-medium is-color-body">
												<n-form-combo v-model="parameter.listeners[i].to" :filter="function(value) { return $services.page.getAllAvailableKeys(page, true, value) }" />
												<n-form-combo v-model="parameter.listeners[i].field" v-if="parameter.type && parameter.type.indexOf('.') >= 0" :filter="listFields.bind($self, parameter.type)" />
												<button class="is-button is-variant-close is-size-small" @click="parameter.listeners.splice(i, 1)"><icon name="times"/></button>
											</div>
											<div v-if="(!parameter.complexDefault && parameter.default) || (parameter.complexDefault && parameter.defaultScript)" class="is-column is-spacing-vertical-gap-medium">
												<h4 class="is-h4">Reset Listener</h4>
												<p class="subscript">Whenever an event is emitted, you can recalculate the default value and set it.</p>
												<div class="is-row is-align-end">
													<button class="is-button is-variant-primary-outline is-size-xsmall" @click="parameter.resetListeners ? parameter.resetListeners.push({to:null, field: null}) : $window.Vue.set(parameter, 'resetListeners', [{to:null,field:null}])"><icon name="plus"/>Reset Listener</button>
												</div>
												<div v-if="parameter.resetListeners">
													<div class="list-row" v-for="i in Object.keys(parameter.resetListeners)" class="is-column has-button-close is-spacing-medium is-color-body">
														<n-form-combo v-model="parameter.resetListeners[i].to" :filter="function(value) { return $services.page.getAllAvailableKeys(page, true, value) }" />
														<n-form-combo v-model="parameter.resetListeners[i].field" v-if="false && parameter.type && parameter.type.indexOf('.') >= 0" :filter="listFields.bind($self, parameter.type)" description="Not yet"  />
														<button class="is-button is-variant-close is-size-small" @click="parameter.resetListeners.splice(i, 1)"><icon name="times"/></button>
													</div>
												</div>
												<page-event-value :page="page" :container="parameter" title="State reset event" name="updatedEvent" @resetEvents="resetEvents" :inline="true"/>
											</div>
										</n-collapsible>
									</div>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="External">
									<div class="is-column is-spacing-medium">
										<p class="is-p is-size-small is-color-light">You can add additional data from the backend or the application to this page. For example when building a detail view of an item, you can retrieve all the necessary information based on an id that you get from the path.</p>
										<ul class="is-menu is-variant-toolbar is-align-end">
											<li class="is-column"><button class="is-button is-color-primary-outline is-size-xsmall" @click="addState"><icon name="plus"/>Backend<n-info>Load initial state from the backend</n-info></button></li>
											<li class="is-column"><button class="is-button is-color-primary-outline is-size-xsmall" @click="addApplicationState"><icon name="plus"/></span>Application<n-info>Use state available at the application level</n-info></button></li>
											<li class="is-column"><button class="is-button is-color-primary-outline is-size-xsmall" @click="function() { if (page.content.stateErrors) page.content.stateErrors.push({}); else $window.Vue.set(page.content, 'stateErrors', [{}]) }"><icon name="plus"/>Error<n-info>In case of state errors when loading, where should the user be routed?</n-info></button></li>
										</ul>
									</div>
									<div class="is-accordion is-highlight-left">
										<n-collapsible :only-one-open="true" :title="state.name ? state.name : 'unnamed'" v-for="state in page.content.states" :after="state.inherited ? 'Application' : 'Backend'" class="is-color-primary-light" content-class="is-spacing-medium">
											<div slot="buttons" class="is-row is-spacing-horizontal-right-small">
												<button class="is-button is-variant-danger-outline is-size-xsmall" @click="page.content.states.splice(page.content.states.indexOf(state), 1)"><icon name="times"/></button>
											</div>
											<n-form-text :value="state.name" @input="function(newValue) { if (!validateStateName(newValue).length) state.name = newValue; }" label="Name" :required="true" :validator="validateStateName" :timeout="600"/>
											<div v-if="state.inherited">
												<n-form-combo v-model="state.applicationName" :filter="$services.page.getApplicationStateNames" label="Application State" />
											</div>
											<div v-else>
												<n-form-combo :value="state.operation" :filter="getStateOperations" label="Operation" @input="function(newValue) { setStateOperation(state, newValue) }"/>
												<n-page-mapper v-if="state.operation && Object.keys($services.page.getPageParameters(page)).length" :to="getOperationParameters(state.operation)"
													:from="{page:$services.page.getPageParameters(page)}" 
													v-model="state.bindings"/>
											</div>
											<page-event-value :page="page" :container="state" title="Successful Update Event" name="updateEvent" @resetEvents="resetEvents" :inline="true"/>
											<n-form-ace mode="javascript" v-model="state.condition" label="Condition" info="If left empty it will always run. If filled in, it will only run if the condition returns true." :timeout="600"/>
											<h4 class="is-h4">Refresh Events</h4>
											<p class="is-p is-size-small is-color-light">You can refresh this state when a particular event occurs.</p>
											<div class="list" v-if="state.refreshOn">
												<div v-for="i in Object.keys(state.refreshOn)" class="has-button-close">
													<n-form-combo v-model="state.refreshOn[i]" :filter="getAvailableEvents" placeholder="event"/>
													<button class="is-button is-variant-close is-size-small is-spacing-horizontal-right-large" @click="state.refreshOn.splice(i, 1)"><icon name="times"/></button>
												</div>
											</div>
											<div class="is-row is-align-end">
												<button class="is-button is-variant-primary-outline is-size-xsmall" @click="state.refreshOn ? state.refreshOn.push('') : $window.Vue.set(state, 'refreshOn', [''])"><icon name="plus"/>Refresh Event</button>
											</div>
										</n-collapsible>
									</div>
									<div v-if="page.content.stateErrors" class="is-accordion is-highlight-left">
										<n-collapsible :only-one-open="true" class="is-color-primary-light" :title="stateError.code ? stateError.code : 'no code'" v-for="stateError in page.content.stateErrors" after="Error" content-class="is-spacing-medium">
											<div slot="buttons" class="is-row is-spacing-horizontal-right-small">
												<button class="is-button is-variant-danger-outline is-size-xsmall" @click="page.content.stateErrors.splice(page.content.stateErrors.indexOf(stateError), 1)"><icon name="times"/></button>
											</div>
											<n-form-text v-model="stateError.code" label="Error Code" :timeout="600"/>
											<n-form-combo label="Error Page" :filter="$services.page.getRoutes" v-model="stateError.route"/>
										</n-collapsible>
									</div>
								</n-collapsible>
								<n-collapsible title="Computed" class="list" v-if="false">
									<div class="padded-content">
										<p class="is-p is-size-small is-color-light">You can compute new values based on existing state. This is especially interesting if the calculation is non trivial and you don't want to embed it into the page.</p>
										<div class="is-row is-align-end">
											<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addComputed"><icon name="plus"/>Computed State</button>
										</div>
									</div>
									<div v-if="page.content.computed" class="is-accordion is-highlight-left">
										<n-collapsible class="is-color-primary-light" :title="state.name ? state.name : 'unnamed'" v-for="state in page.content.computed" content-class="is-spacing-medium">
											<n-form-text :timeout="600" :value="state.name" @input="function(newValue) { if (!validateStateName(newValue).length) state.name = newValue; }" label="Name" :required="true" :validator="validateStateName"/>
											<n-page-mapper v-if="false && state.name" :to="[state.name]"
												:from="availableParameters" 
												v-model="state.bindings"/>
											<n-form-ace mode="javascript" v-model="state.script"/>
											<div class="list" v-if="state.refreshOn">
												<div v-for="i in Object.keys(state.refreshOn)" class="has-button-close">
													<n-form-combo v-model="state.refreshOn[i]" :filter="getAvailableEvents" placeholder="event"/>
													<button class="is-button is-variant-close is-size-small is-spacing-horizontal-right-large" @click="state.refreshOn.splice(i, 1)"><icon name="times"/></button>
												</div>
											</div>
											<div class="is-row is-align-end">
												<button class="is-button is-variant-primary-outline is-size-xsmall" @click="state.refreshOn ? state.refreshOn.push('') : $window.Vue.set(state, 'refreshOn', [''])"><icon name="plus"/>Refresh Event</button>
											</div>
										</n-collapsible>
									</div>
								</n-collapsible>
							</div>
							<hr class="is-line is-size-large is-color-primary-light"/>
							<h2 class="is-h4 is-spacing-medium is-color-primary-outline">Eventing</h2>
							<p class="is-p is-size-small is-color-light is-spacing-medium">Eventing allows the user to interact with the page, performing calls to backend, switching to another page...</p>
							<div class="is-accordion is-highlight-left">
								<n-collapsible :only-one-open="true" title="Initial" class="list">
									<div class="is-column is-spacing-medium">
										<p class="is-p is-size-small is-color-light">Initial events are run when the page is first loaded but <i>after</i> the initial state is guaranteed to be there. Initial events can be periodically rerun, this allows for long polling or performing some initial checks.</p>
										<div class="is-row is-align-end">
											<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addInitialEvent"><icon name="plus"/>Initial Event</button>
										</div>
									</div>
									<n-collapsible :only-one-open="true" class="is-color-primary-light" :title="$window.nabu.page.event.getName(event, 'definition') ? $window.nabu.page.event.getName(event, 'definition') : 'Unnamed Event'" v-for="event in page.content.initialEvents" content-class="is-spacing-medium" after="Initial Event">
										<div slot="buttons" class="is-row is-spacing-horizontal-right-small">
											<button class="is-button is-variant-danger-outline is-size-xsmall" @click="page.content.initialEvents.splice(page.content.initialEvents.indexOf(event), 1)"><icon name="times"/></button>
										</div>
										<n-form-text v-model="event.condition" label="Condition" :timeout="600"/>
										<n-form-text v-model="event.timeout" label="Repeat Interval (ms)" info="Every interval, the condition of this event will be checked, if true, the event is emitted, otherwise it will recheck at the next interval" :timeout="600"/>
										<page-event-value :page="page" :container="event" title="Initial Event" name="definition" @resetEvents="resetEvents" :inline="true"/>
									</n-collapsible>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Triggers" class="list">
									<div class="is-column is-spacing-medium">
										<p class="is-p is-size-small is-color-light">Triggers can be used to react to events as they occur. User interaction with this page will usually trigger events which can lead to actions defined here.</p>
										<div class="is-row is-align-end">
											<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addAction"><icon name="plus"/>Trigger</button>
										</div>
									</div>
									<n-collapsible :only-one-open="true" v-for="action in page.content.actions" class="is-color-primary-light" :title="action.name ? action.name : 'Unnamed Trigger'" :after="action.on ? 'on ' + action.on : null" content-class="is-spacing-medium" after="Trigger">
										<ul slot="buttons" class="is-menu is-variant-toolbar is-spacing-horizontal-right-small">
											<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-xsmall" @click="moveActionTop(action)"><span class="fa fa-chevron-circle-left"></span></button></li>
											<li class="is-column"><button class="is-button is-variant-primary-outline is-size-xsmall" @click="moveTriggerUp(action)"><span class="fa fa-chevron-circle-up"></span></button></li>
											<li class="is-column"><button class="is-button is-variant-primary-outline is-size-xsmall" @click="moveTriggerDown(action)"><span class="fa fa-chevron-circle-down"></span></button></li>
											<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-xsmall" @click="moveActionBottom(action)"><span class="fa fa-chevron-circle-right"></span></button></li>
											<li class="is-column"><button class="is-button is-variant-danger-outline is-size-xsmall" @click="page.content.actions.splice(page.content.actions.indexOf(action), 1)"><icon name="times"/></button></li>
										</ul>
										<n-form-text v-model="action.name" label="Name" :required="true" :timeout="600"/>
										<n-form-text v-model="action.confirmation" label="Confirmation Message" :timeout="600"/>
										<n-form-combo v-model="action.on" label="Trigger On" :filter="getAvailableEvents"/>
										<n-form-text v-model="action.condition" label="Condition" v-if="action.on" :timeout="600"/>
										<n-form-text v-model="action.scroll" label="Scroll to" v-if="!action.operation && !action.function" :timeout="600"/>
										<n-form-combo v-model="action.route" v-if="!action.operation && !action.url && !action.function" label="Redirect" :filter="$services.page.getRoutes"/>
										<n-form-combo v-model="action.anchor" v-if="action.url || action.route || (action.operation && isGet(action.operation))" label="Anchor" :filter="function(value) { return value ? [value, '$blank', '$window'] : ['$blank', '$window'] }"/>
										<n-form-combo :key="'operation' + page.content.actions.indexOf(action)" v-model="action.operation" v-if="!action.route && !action.scroll && !action.url && !action.function" label="Operation" :filter="getOperations" />
										<page-event-value class="no-more-padding" :inline="true" v-if="action.operation && isBinaryDownload(action.operation)" :page="page" :container="action" title="Download Failed Event" name="downloadFailedEvent" @resetEvents="resetEvents"/>
										<n-form-text v-model="action.timeout" v-if="action.operation" label="Action Timeout" info="You can emit an event if the action takes too long" :timeout="600"/>
										<page-event-value class="no-more-padding"  v-if="action.operation && action.timeout" :page="page" :container="action" title="Timeout Event" name="timeoutEvent" @resetEvents="resetEvents"/>
										<n-form-combo v-model="action.function" v-if="!action.route && !action.scroll && !action.url && !action.operation" label="Function" :filter="$services.page.listFunctions" />
										<n-form-text v-if="action.function && $services.page.hasFunctionOutput(action.function)" v-model="action.functionOutputEvent" label="Function Output Event" info="Emit the output of the function as event"/>
										<n-form-text v-model="action.url" label="URL" v-if="!action.route && !action.operation && !action.scroll && !action.function" :timeout="600"/>
										<page-event-value class="no-more-padding" :page="page" :container="action" title="Chain Event" name="chainEvent" @resetEvents="resetEvents" :inline="true"/>
										<n-form-text v-model="action.chainTimeout" v-if="$window.nabu.page.event.getName(action, 'chainEvent') != null" label="Timeout for chain event" :timeout="600"/>
										<n-form-switch v-if="action.operation || action.function" v-model="action.isSlow" label="Is slow operation?"/>
										<n-form-text v-if="action.operation && !isBinaryDownload(action.operation)" v-model="action.event" label="Success Event" @input="resetEvents()" :timeout="600"/>
										<n-form-text v-if="action.operation && !isBinaryDownload(action.operation)" v-model="action.errorEvent" label="Error Event" @input="resetEvents()" :timeout="600"/>
										<n-form-combo v-if="action.operation && action.event && getOperationArrays(action.operation).length > 0" v-model="action.singlify" label="Limit to array element" info="If you have an array, you can scope the event to only the first element of it"
											:filter="getOperationArrays.bind($self, action.operation)"/>
										<n-form-switch v-if="action.operation" v-model="action.expandBindings" label="Field level bindings"/>
										<div class="is-row" v-if="action.operation && !action.route && action.expandBindings">
											<n-form-combo class="is-fill-normal"
												:items="Object.keys(availableParameters)" v-model="autoMapFrom"/>
											<button class="is-button is-variant-primary-outline is-size-xsmall" @click="automap(action)" :disabled="!autoMapFrom">Automap</button>
										</div>
										<n-page-mapper v-if="action.operation && !action.route && !action.expandBindings" :to="getOperationParameters(action.operation)"
											:from="availableParameters" 
											v-model="action.bindings"/>
										<n-page-mapper v-else-if="action.operation && !action.route && action.expandBindings" :to="getOperationParameters(action.operation, true)"
											:from="availableParameters" 
											v-model="action.bindings"/>
										<n-page-mapper v-if="action.route" :to="$services.page.getRouteParameters($services.router.get(action.route))"
											:from="availableParameters" 
											v-model="action.bindings"/>
										<n-page-mapper v-if="action.function && !action.operation && !action.route" :to="$services.page.getFunctionInput(action.function)"
											:from="availableParameters" 
											v-model="action.bindings"/>
											
										<n-form-ace mode="javascript" v-model="action.script" label="Execute Script"/>
										
										<h4 class="is-h4">Reset Events</h4>
										<p class="is-p is-size-small is-color-light">If this trigger executes, we can reset other events.</p>
										<div class="is-row is-align-end is-spacing-medium">
											<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addEventReset(action)"><icon name="plus"/>Event To Reset</button>
										</div>
										<div v-if="action.eventResets">
											<div class="has-button-close" v-for="i in Object.keys(action.eventResets)">
												<n-form-combo v-model="action.eventResets[i]" :filter="getAvailableEvents"/>
												<button class="is-button is-variant-close is-size-small is-spacing-horizontal-right-large" @click="action.eventResets.splice(i, 1)"><icon name="times"/></button>
											</div>
										</div>
									</n-collapsible>
								</n-collapsible>	
								<n-collapsible :only-one-open="true" title="Notifications" class="list">
									<div class="is-row is-align-end is-spacing-medium">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addNotification"><icon name="plus"/>Notification</button>
									</div>
									<div v-if="page.content.notifications">
										<n-collapsible :only-one-open="true" class="is-color-primary-light" :title="(notification.name ? notification.name : 'unnamed')" :after="notification.on ? 'on ' + notification.on : 'no trigger yet'" v-for="notification in page.content.notifications" content-class="is-spacing-medium">
											<n-form-text v-model="notification.name" label="Name" :timeout="600" info="Allows you to target this notification at a later point if needed"/>
											<n-form-text v-model="notification.duration" label="Duration" :timeout="600" info="How long the notification should stay up (in ms)"/>
											<n-form-combo v-model="notification.on" label="Trigger On" :filter="getAvailableEvents"/>	
											<n-form-text v-model="notification.condition" label="Condition" v-if="notification.on" :timeout="600"/>
											<n-form-text v-model="notification.title" label="Title" :timeout="600" info="An optional title for this notification, it can include variables from the originating event using the {{}} syntax"/>
											<n-form-text v-model="notification.message" label="Message" :timeout="600" info="An optional title for this notification, it can include variables from the originating event using the {{}} syntax"/>
											<n-form-combo v-model="notification.severity" label="Severity" :timeout="600" :items="['info', 'warning', 'error']"/>
											<n-form-switch v-model="notification.closeable" label="Closeable" info="Can the user explicitly close the notification?"/>
											<n-form-text v-model="notification.icon" label="Icon" :timeout="600" info="The correct value for this depends on your icon provider and the notification provider"/>
											<page-event-value :inline="true" class="no-more-padding" :page="page" :container="notification" title="Notification Event" name="chainEvent" :name-modifiable="false"/>
										</n-collapsible>
									</div>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Analysis" class="list">
									<div class="is-row is-align-end is-spacing-medium">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addAnalysis"><icon name="plus"/>Analysis</button>
									</div>
									<n-collapsible :only-one-open="true" class="is-color-primary-light" :title="(analysis.chainEvent && analysis.chainEvent.name ? analysis.chainEvent.name : 'unnamed')" :after="analysis.on ? 'on ' + analysis.on : 'no trigger yet'" v-for="analysis in page.content.analysis" content-class="is-spacing-medium">
										<div slot="buttons" class="is-row is-spacing-horizontal-right-small">
											<button @click="page.content.analysis.splice(page.content.analysis.indexOf(analysis), 1)"><icon name="times"/></button>
										</div>
										<n-form-combo v-model="analysis.on" label="Trigger On" :filter="getAvailableEvents"/>
										<n-form-text v-model="analysis.condition" label="Condition" v-if="analysis.on" :timeout="600"/>
										<page-event-value :inline="true" class="no-more-padding" :page="page" :container="analysis" title="Analysis Event" name="chainEvent" @resetEvents="resetEvents"/>
									</n-collapsible>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Publish Global Events" class="list" content-class="is-spacing-medium">
									<div class="is-row is-align-end">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addGlobalEvent"><icon name="plus"/>Global Event</button>
									</div>
									<div class="is-column is-spacing-vertical-gap-medium" v-if="page.content.globalEvents">
										<n-form-section class="is-column is-color-body has-button-close is-spacing-medium" v-for="i in Object.keys(page.content.globalEvents)">
											<n-form-combo v-model="page.content.globalEvents[i].localName"
												label="Local Name"
												:filter="getAvailableEvents"/>
											<n-form-text v-model="page.content.globalEvents[i].globalName" 
												label="Global Name"
												:placeholder="page.content.globalEvents[i].localName"/>
											<button class="is-button is-variant-close" @click="page.content.globalEvents.splice(i, 1)"><icon name="times"/></button>
										</n-form-section>
									</div>
								</n-collapsible>
								<n-collapsible :only-one-open="true" title="Subscribe Global Events" class="list" content-class="is-spacing-medium">
									<div class="is-row is-align-end">
										<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addGlobalEventSubscription"><icon name="plus"/>Global Event</button>
									</div>
									<div class="is-column is-spacing-vertical-gap-medium" v-if="page.content.globalEventSubscriptions">
										<n-form-section class="is-column is-color-body has-button-close is-spacing-medium" v-for="i in Object.keys(page.content.globalEventSubscriptions)">
											<n-form-combo v-model="page.content.globalEventSubscriptions[i].globalName"
												label="Global Name"
												:items="$window.Object.keys($services.page.getGlobalEvents())"/>
											<n-form-text v-model="page.content.globalEventSubscriptions[i].localName" 
												label="Local Name"
												:placeholder="page.content.globalEventSubscriptions[i].globalName"/>
											<button class="is-button is-variant-close" @click="page.content.globalEventSubscriptions.splice(i, 1)"><icon name="times"/></button>
										</n-form-section>
									</div>
								</n-collapsible>
							</div>
							<component v-for="plugin in plugins" :is="plugin.configure" 
								:page="page" 
								:edit="edit"/>
						</div>
					</n-form>
				</div>
				
				<page-components-overview v-else-if="activeTab == 'components'"/>
				
				<div v-else-if="activeTab == 'selected' && cell && selectedType == 'cell'" :key="'page_' + pageInstanceId + '_cell_' + cell.id + '_configuration'">
					<n-form class="is-variant-floating-labels" key="cell-form">
						<h2 class="is-h4 is-color-primary-outline is-spacing-medium">Cell Configuration</h2>
						<p class="is-p is-size-small is-color-light is-spacing-medium">Here you can configure cell settings that are available to all cells in the grid regardless of the content type.</p>
						<n-collapsible :only-one-open="true" title="Cell Settings" key="cell-settings" content-class="is-spacing-medium">
							<n-form-combo label="Route" :filter="$services.page.getRoutes" v-model="cell.alias"
								:key="'page_' + pageInstanceId + '_' + cell.id + '_alias'"
								:required="true"
								after="The component that should be routed into this cell"
								@input="$services.page.normalizeAris(page, cell)"/>
							<n-form-text label="Cell Name" v-model="cell.name" after="A descriptive name for this cell" :timeout="600"/>
							<n-form-text label="Cell Id" v-model="cell.customId" after="Add a named container to render child content in." :timeout="600"/>
							<n-page-mapper v-if="cell.alias" 
								:key="'page_' + pageInstanceId + '_' + cell.id + '_mapper'"
								:to="getRouteParameters(cell)"
								:from="getAvailableParameters(cell)" 
								v-model="cell.bindings"/>
						
						</n-collapsible>
						<n-collapsible :only-one-open="true" title="Rendering" content-class="is-spacing-medium" class="is-highlight-left">
							<n-form-combo v-model="cell.state.openTrigger" label="Open on" placeholder="Always open" :items="['click', 'hover']"/>
							<n-form-ace mode="javascript" label="Condition" v-model="cell.condition" after="If you fill in a condition, the cell will only render the content if the condition evaluates to true" :timeout="600"/>
							<n-form-combo label="Cell Renderer" v-model="cell.renderer" :items="$services.page.getRenderers('cell')" 
								after="You can set a custom renderer for this cell"
								empty-value="No renderers found"
								:formatter="function(x) { return x.name }" 
								:extracter="function(x) { return x.name }" info="Use a specific renderer for this cell"/>
								
							<div v-if="cell.renderer && $services.page.getRendererState(cell.renderer, row, page, $services.page.getAllAvailableParameters(page))" class="is-column is-spacing-vertical-gap-medium">
								<n-form-text v-model="cell.runtimeAlias" label="Runtime alias for renderer state"/>
								<n-form-switch v-model="cell.retainState" label="Retain state once cell is destroyed" v-if="cell.runtimeAlias"/>
							</div>
							<div v-if="cell.renderer && $services.page.getRendererConfiguration(cell.renderer)">
								<component :is="$services.page.getRendererConfiguration(cell.renderer)" :target="row" :page="page"/>
							</div>
								
							<n-form-text label="Cell Width" v-model="cell.width" info="By default flex is used to determine cell size, you can either configure a number for flex or choose to go for a fixed value" :timeout="600"/>
							<n-form-text label="Cell Height" v-model="cell.height" info="You can configure any height, for example 200px" :timeout="600"/>
							<n-form-text label="Cell Reference" v-model="cell.ref" info="A reference you can use to retrieve this cell programmatically" :timeout="600" v-if="false"/>
							<n-form-switch label="Stop Rerender" v-model="cell.stopRerender" info="All components are reactive to their input, you can however prevent rerendering by settings this to true"/>
							<div v-if="$services.page.devices.length">
								<p class="is-p is-size-small is-color-light is-spacing-vertical-bottom-small">You can choose to render the cell only if a set of device rules is met.</p>
								<div class="is-row is-align-end is-spacing-vertical-bottom-small">
									<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addDevice(cell)"><icon name="plus"/>Device rule</button>
								</div>
								<div v-if="cell.devices" class="is-column is-spacing-vertical-gap-medium">
									<div class="has-button-close is-column is-spacing-medium is-color-body" v-for="device in cell.devices">
										<n-form-combo v-model="device.operator" :items="['>', '>=', '<', '<=', '==']"/>
										<n-form-combo v-model="device.name" 
											:filter="suggestDevices"/>
										<button class="is-button is-variant-close" @click="cell.devices.splice(cell.devices.indexOf(device), 1)"><icon name="times"/></button>
									</div>
								</div>
							</div>
						</n-collapsible>
						<n-collapsible :only-one-open="true" title="Eventing" key="cell-events" content-class="is-spacing-medium" class="is-highlight-left">
							<n-form-switch label="Closeable" v-model="cell.closeable" v-if="!cell.on"/>
							<n-form-combo label="Show On" v-model="cell.on" :filter="getAvailableEvents" v-if="!cell.closeable"
								after="Only show this cell if a certain event is triggered"/>
							<n-form-combo label="Target" :items="['page', 'sidebar', 'prompt', 'absolute']" v-model="cell.target"
								after="By default the cell will render in the page"/>
							<n-form-switch label="Prevent Auto Close" v-model="cell.preventAutoClose" v-if="cell.target == 'sidebar'"
								after="The sidebar will automatically close when the user clicks elsewhere unless this is toggled"/>
							<n-form-switch label="Optimize (may result in stale content)" v-model="cell.optimizeVueKey" v-if="cell.on"/>
							<n-form-text label="Top" v-model="cell.top" v-if="cell.target == 'absolute'"/>
							<n-form-text label="Bottom" v-model="cell.bottom" v-if="cell.target == 'absolute'"/>
							<n-form-text label="Left" v-model="cell.left" v-if="cell.target == 'absolute'"/>
							<n-form-text label="Right" v-model="cell.right" v-if="cell.target == 'absolute'"/>
							<n-form-text label="Minimum Width" v-model="cell.minWidth" v-if="cell.target == 'absolute'"/>
							<n-form-switch label="Position fixed?" v-model="cell.fixed" v-if="cell.target == 'absolute'"/>
							<n-form-switch label="Autoclose" v-model="cell.autoclose" v-if="cell.target == 'absolute' || cell.target == 'prompt'"/>
							<page-event-value :page="page" :container="cell" title="Click Event" name="clickEvent" @resetEvents="resetEvents" :inline="true"/>
						</n-collapsible>
						<n-collapsible :only-one-open="true" title="Styling" class="is-highlight-left">
							<div class="is-column is-spacing-medium">
								<n-form-text label="Cell Class" v-model="cell.class" :timeout="600"/>
								<div class="is-row is-align-end">
									<button class="is-button is-variant-primary-outline is-size-xsmall" @click="cell.styles == null ? $window.Vue.set(cell, 'styles', [{class:null,condition:null}]) : cell.styles.push({class:null,condition:null})"><icon name="plus"/>Cell Style</button>
								</div>
								<div class="is-column is-spacing-vertical-gap-medium" v-if="cell.styles">
									<n-form-section class="is-column is-color-body is-spacing-medium has-button-close" v-for="style in cell.styles">
										<n-form-text v-model="style.class" label="Class"/>
										<n-form-text v-model="style.condition" label="Condition" class="vertical"/>
										<button class="is-button is-variant-close" @click="cell.styles.splice(cell.styles.indexOf(style), 1)"><icon name="times"/></button>
									</n-form-section>
								</div>
							</div>
							<aris-editor v-if="$services.page.useAris && $services.page.normalizeAris(page, cell)" :child-components="$services.page.getCellComponents(page, cell)" :container="cell.aris"
									:specific="cell.alias"/>
						</n-collapsible>
						<div v-if="canConfigureInline(cell)" class="is-column is-spacing-vertical-top-large">
							<h2 class="is-h4 is-spacing-medium is-color-primary-outline">Content Configuration</h2>
							<p class="is-p is-size-small is-color-light is-spacing-medium">Here you can find additional configuration settings for the content type that you have chosen.</p>
							<component :is="getCellConfigurator(cell)" v-bind="getCellConfiguratorInput(cell)"/>
						</div>
					</n-form>
				</div>
				
				<div v-else-if="activeTab == 'selected' && row && selectedType == 'row'" :key="'page_' + pageInstanceId + '_row_' + row.id + '_configuration'">
					<n-form class="is-variant-floating-labels" key="cell-form">
						<h2 class="is-h4 is-color-primary-outline is-spacing-medium">Row Configuration</h2>
						<n-collapsible title="Row Settings" content-class="is-spacing-medium">
							<n-form-text label="Row Name" v-model="row.name" info="A descriptive name" :timeout="600"/>
							<h2>Rendering<span class="subscript">Choose how this row will be rendered</span></h2>
							<n-form-combo label="Direction" v-model="row.direction" :items="['horizontal', 'vertical']"/>
							<n-form-combo label="Alignment" v-model="row.align" :items="['center', 'flex-start', 'flex-end', 'stretch', 'baseline']"/>
							<n-form-combo label="Justification" v-model="row.justify" :items="['center', 'flex-start', 'flex-end', 'space-between', 'space-around', 'space-evenly']"/>
							<n-form-ace mode="javascript" label="Condition" v-model="row.condition" class="vertical"/>
							
							<h2>Additional<span class="subscript">Configure some additional settings for this row</span></h2>
							<n-form-text label="Row Id" v-model="row.customId" info="If you set a custom id for this row, a container will be rendered in this row with that id. This can be used for targeting with specific content."/>
							<n-form-combo label="Row Renderer" v-model="row.renderer" :items="$services.page.getRenderers('row')"  :formatter="function(x) { return x.title ? x.title : x.name }" :extracter="function(x) { return x.name }"/>
							<div v-if="row.renderer && $services.page.getRendererState(row.renderer, row, page, $services.page.getAllAvailableParameters(page))" class="is-column is-spacing-vertical-gap-medium">
								<n-form-text v-model="row.runtimeAlias" label="Runtime alias for renderer state"/>
								<n-form-switch v-model="row.retainState" label="Retain state once row is destroyed" v-if="row.runtimeAlias"/>
							</div>
							<div v-if="row.renderer && $services.page.getRendererConfiguration(row.renderer)">
								<component :is="$services.page.getRendererConfiguration(row.renderer)" :target="row" :page="page"/>
							</div>
							
							<div v-if="$services.page.devices.length">
								<div class="is-row is-align-end">
									<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addDevice(row)"><icon name="plus"/>Device rule</button>
								</div>
								<div v-if="row.devices" class="is-column is-spacing-vertical-gap-medium">
									<div class="is-column is-spacing-medium is-color-body has-button-close" v-for="device in row.devices">
										<n-form-combo v-model="device.operator" :items="['>', '>=', '<', '<=', '==']"/>
										<n-form-combo v-model="device.name" 
											:filter="suggestDevices"/>
										<button class="is-button is-variant-close" @click="row.devices.splice(row.devices.indexOf(device), 1)"><icon name="times"/></button>
									</div>
								</div>
							</div>
						</n-collapsible>
						<n-collapsible title="Eventing" content-class="is-spacing-medium">
							<n-form-combo label="Show On" v-model="row.on" :filter="getAvailableEvents"/>
						</n-collapsible>
						<n-collapsible title="Styling">
							<div class="padded-content">
								<n-form-text label="Class" v-model="row.class" v-if="false"/>
								<n-form-combo label="Class" v-model="row.class" :filter="suggesPageRowClasses" :timeout="600"/>
							</div>
							<div class="is-row is-align-end">
								<button @click="row.styles == null ? $window.Vue.set(row, 'styles', [{class:null,condition:null}]) : row.styles.push({class:null,condition:null})">Add Style</button>
							</div>
							<div class="padded-content" v-if="row.styles">
								<n-form-section class="list-row" v-for="style in row.styles">
									<n-form-text v-model="style.class" label="Class"/>
									<n-form-text v-model="style.condition" label="Condition"/>
									<span @click="row.styles.splice(row.styles.indexOf(style), 1)" class="fa fa-times"></span>
								</n-form-section>
							</div>
							<aris-editor v-if="$services.page.useAris && $services.page.normalizeAris(page, row, 'row')" :child-components="$services.page.getRowComponents(page, row)" :container="row.aris"/>
						</n-collapsible>
					</n-form>
				</n-sidebar>
			</div>
		</n-sidebar>
		
		<n-page-rows v-if="page.content.rows" :rows="page.content.rows" :page="page" :edit="edit"
			:depth="0"
			:parameters="parameters"
			:events="events"
			:ref="page.name + '_rows'"
			:root="true"
			:page-instance-id="pageInstanceId"
			:stop-rerender="stopRerender"
			@select="selectItem"
			@viewComponents="viewComponents = edit"
			@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { page.content.rows.splice(page.content.rows.indexOf(row), 1) }) }"/>
			
		<div class="page-menu n-page-menu" v-if="edit && false">
			<button @click="viewComponents = !viewComponents"><span class="fa fa-cubes" title="Add Components"></span></button>
		</div>
	</component>
</template>

<template id="page-rows">
	<component :is="rowsTag()" class="is-grid">
		<component :is="rowTagFor(row)" v-for="row in getCalculatedRows()" class="is-page-row" :id="page.name + '_' + row.id" 
				:class="$window.nabu.utils.arrays.merge(['page-row-' + row.cells.length, row.class ? row.class : null, {'collapsed': row.collapsed}, {'is-empty': edit && (!row.cells || !row.cells.length) } ], rowClasses(row))"  
				:key="'page_' + pageInstanceId + '_row_' + row.id"
				:row-key="'page_' + pageInstanceId + '_row_' + row.id"
				v-if="edit || shouldRenderRow(row)"
				:style="rowStyles(row)"
				@drop="drop($event, row)" 
				@dragend="$services.page.clearDrag($event)"
				@dragover="dragOver($event, row)"
				@dragexit="dragExit($event, row)"
				@mouseout="mouseOut($event, row)"
				@mouseover="mouseOver($event, row)"
				@click.ctrl="goto($event, row)"
				@click.meta="goto($event, row)"
				@click.alt="$emit('select', row, null, 'row')"
				:target="row"
				:edit="edit"
				:page="page"
				:child-components="$services.page.calculateArisComponents(row.aris, row.renderer, $self)">
			<div v-if="false && (edit || $services.page.wantEdit || row.wantVisibleName) && row.name && !row.collapsed" :style="getRowEditStyle(row)" class="row-edit-label"
				:class="'direction-' + (row.direction ? row.direction : 'horizontal')"><span>{{row.name}}</span></div>
			<div class="is-row-menu is-layout is-align-main-center is-align-cross-bottom is-spacing-vertical-xsmall" v-if="edit" @mouseenter="menuHover" @mouseleave="menuUnhover">
				<button class="is-button is-variant-primary is-size-xsmall has-tooltip is-wrap-none" v-if="!row.collapsed" @click="goto($event, row)"><icon name="cog"/><span class="is-text">Configure row</span></button>
			</div>
			<div v-if="row.customId" class="is-anchor" :id="row.customId"><!-- to render stuff in without disrupting the other elements here --></div>
			
			<template v-for="cell in getCalculatedCells(row)">
				<template v-if="edit">
					<component :is="cellTagFor(row, cell)" :style="getStyles(cell)" 
							v-show="!edit || !row.collapsed"
							:id="page.name + '_' + row.id + '_' + cell.id" 
							:class="$window.nabu.utils.arrays.merge([{'clickable': hasCellClickEvent(cell)}, {'is-page-column': edit || !cell.target || cell.target == 'page', 'page-prompt': cell.target == 'prompt' || cell.target == 'sidebar' || cell.target == 'absolute' }, cell.class ? $services.page.interpret(cell.class, $self) : null, {'has-page': hasPageRoute(cell), 'is-root': root}, {'is-empty': edit && !cell.alias && (!cell.rows || !cell.rows.length) } ], cellClasses(cell))" 
							:key="cellId(cell)"
							:cell-key="'page_' + pageInstanceId + '_cell_' + cell.id"
							@click="clickOnCell(row, cell)"
							@click.ctrl="goto($event, row, cell)"
							@click.meta="goto($event, row, cell)"
							@mouseout="mouseOut($event, row, cell)"
							@mouseover="mouseOver($event, row, cell)"
							@dragend="$services.page.clearDrag($event)"
							@dragover="dragOverCell($event, row, cell)"
							@dragexit="dragExitCell($event, row, cell)"
							@drop="dropCell($event, row, cell)"
							:target="cell"
							:edit="edit"
							:page="page"
							:child-components="$services.page.calculateArisComponents(cell.aris, cell.renderer, $self)">
						<div v-if="cell.customId" class="is-anchor" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
						
						<div class="is-column-content" v-if="cell.alias" :key="'page_' + pageInstanceId + '_edit_' + cell.id" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { var rerender = cell.aris && cell.aris.rerender; if (cell.aris) cell.aris.rerender = false; return rerender; }, created: getCreatedComponent(row, cell) }"></div>
						<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
							:depth="depth + 1"
							:parameters="parameters"
							:events="events"
							:ref="page.name + '_' + cell.id + '_rows'"
							:local-state="getLocalState(row, cell)"
							:page-instance-id="pageInstanceId"
							:stop-rerender="stopRerender"
							v-bubble:viewComponents
							v-bubble:select
							@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
					
						<div class="is-column-menu is-layout is-align-main-center is-spacing-vertical-xsmall" @mouseenter="menuHover" @mouseleave="menuUnhover">
							<button v-if="cell.alias" class="is-button is-variant-secondary is-size-xsmall has-tooltip is-wrap-none" @click="configureCell($event, row, cell)"><icon name="cog"/><span class="is-text">Configure {{ cell.alias ? $services.page.prettifyRouteAlias(cell.alias) : "Cell" }}</span></button>
							<button v-else class="is-button is-variant-secondary is-size-xsmall has-tooltip is-wrap-none" @click="goto($event, row, cell)"><icon name="magic"/><span class="is-text">Configure {{ cell.alias ? $services.page.prettifyRouteAlias(cell.alias) : "Cell" }}</span></button>
						</div>
					</component>
				</template>
				<template v-else-if="shouldRenderCell(row, cell)">
					<n-sidebar v-if="cell.target == 'sidebar'" @close="close(cell)" :popout="false" :autocloseable="!cell.preventAutoClose" class="content-sidebar" :style="getSideBarStyles(cell)">
						<component :is="cellTagFor(row, cell)" :style="getStyles(cell)" 
								v-show="!edit || !row.collapsed"
								:id="page.name + '_' + row.id + '_' + cell.id" 
								:class="$window.nabu.utils.arrays.merge([{'clickable': hasCellClickEvent(cell)}, {'is-page-column': edit || !cell.target || cell.target == 'page', 'page-prompt': cell.target == 'prompt' || cell.target == 'sidebar' || cell.target == 'absolute' }, cell.class ? $services.page.interpret(cell.class, $self) : null, {'has-page': hasPageRoute(cell), 'is-root': root}, {'is-empty': edit && !cell.alias && (!cell.rows || !cell.rows.length) } ], cellClasses(cell))" 
								:key="cellId(cell)"
								:cell-key="'page_' + pageInstanceId + '_cell_' + cell.id"
								@click="clickOnCell(row, cell)"
								@click.ctrl="goto($event, row, cell)"
								@click.meta="goto($event, row, cell)"
								@mouseout="mouseOut($event, row, cell)"
								@mouseover="mouseOver($event, row, cell)"
								@dragend="$services.page.clearDrag($event)"
								@dragover="dragOverCell($event, row, cell)"
								@dragexit="dragExitCell($event, row, cell)"
								@drop="dropCell($event, row, cell)"
								:target="cell"
								:edit="edit"
								:page="page"
								:child-components="$services.page.calculateArisComponents(cell.aris, cell.renderer, $self)">
							<div v-if="cell.customId" class="is-anchor" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
							
							<div class="is-column-content" @keyup.esc="close(cell)" :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-if="cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return !stopRerender && !cell.stopRerender }, created: getCreatedComponent(row, cell) }"></div>
							<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
								:depth="depth + 1"
								:parameters="parameters"
								:events="events"
								:ref="page.name + '_' + cell.id + '_rows'"
								:local-state="getLocalState(row, cell)"
								:page-instance-id="pageInstanceId"
								:stop-rerender="stopRerender"
								@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
						</component>
					</n-sidebar>
					<n-prompt v-else-if="cell.target == 'prompt'" @close="close(cell)" :autoclose="cell.autoclose">
						<component :is="cellTagFor(row, cell)" :style="getStyles(cell)" 
								v-show="!edit || !row.collapsed"
								:id="page.name + '_' + row.id + '_' + cell.id" 
								:class="$window.nabu.utils.arrays.merge([{'clickable': hasCellClickEvent(cell)}, {'is-page-column': edit || !cell.target || cell.target == 'page', 'page-prompt': cell.target == 'prompt' || cell.target == 'sidebar' || cell.target == 'absolute' }, cell.class ? $services.page.interpret(cell.class, $self) : null, {'has-page': hasPageRoute(cell), 'is-root': root}, {'is-empty': edit && !cell.alias && (!cell.rows || !cell.rows.length) } ], cellClasses(cell))" 
								:key="cellId(cell)"
								:cell-key="'page_' + pageInstanceId + '_cell_' + cell.id"
								@click="clickOnCell(row, cell)"
								@click.ctrl="goto($event, row, cell)"
								@click.meta="goto($event, row, cell)"
								@mouseout="mouseOut($event, row, cell)"
								@mouseover="mouseOver($event, row, cell)"
								@dragend="$services.page.clearDrag($event)"
								@dragover="dragOverCell($event, row, cell)"
								@dragexit="dragExitCell($event, row, cell)"
								@drop="dropCell($event, row, cell)"
								:target="cell"
								:edit="edit"
								:page="page"
								:child-components="$services.page.calculateArisComponents(cell.aris, cell.renderer, $self)">
							<div v-if="cell.customId" class="is-anchor" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
							
							<div class="is-column-content" @keyup.esc="close(cell)" :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-if="cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return !stopRerender && !cell.stopRerender }, created: getCreatedComponent(row, cell) }"></div>
							<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
								:depth="depth + 1"
								:parameters="parameters"
								:events="events"
								:ref="page.name + '_' + cell.id + '_rows'"
								:local-state="getLocalState(row, cell)"
								:page-instance-id="pageInstanceId"
								:stop-rerender="stopRerender"
								@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
						</component>
					</n-prompt>
					<n-absolute :fixed="cell.fixed" :style="{'min-width': cell.minWidth}" :autoclose="cell.autoclose" v-else-if="cell.target == 'absolute'" @close="close(cell)" :top="cell.top" :bottom="cell.bottom" :left="cell.left" :right="cell.right">          
						<component :is="cellTagFor(row, cell)" :style="getStyles(cell)" 
								v-show="!edit || !row.collapsed"
								:id="page.name + '_' + row.id + '_' + cell.id" 
								:class="$window.nabu.utils.arrays.merge([{'clickable': hasCellClickEvent(cell)}, {'is-page-column': edit || !cell.target || cell.target == 'page', 'page-prompt': cell.target == 'prompt' || cell.target == 'sidebar' || cell.target == 'absolute' }, cell.class ? $services.page.interpret(cell.class, $self) : null, {'has-page': hasPageRoute(cell), 'is-root': root}, {'is-empty': edit && !cell.alias && (!cell.rows || !cell.rows.length) } ], cellClasses(cell))" 
								:key="cellId(cell)"
								:cell-key="'page_' + pageInstanceId + '_cell_' + cell.id"
								@click="clickOnCell(row, cell)"
								@click.ctrl="goto($event, row, cell)"
								@click.meta="goto($event, row, cell)"
								@mouseout="mouseOut($event, row, cell)"
								@mouseover="mouseOver($event, row, cell)"
								@dragend="$services.page.clearDrag($event)"
								@dragover="dragOverCell($event, row, cell)"
								@dragexit="dragExitCell($event, row, cell)"
								@drop="dropCell($event, row, cell)"
								:target="cell"
								:edit="edit"
								:page="page"
								:child-components="$services.page.calculateArisComponents(cell.aris, cell.renderer, $self)">
							<div v-if="cell.customId" class="is-anchor" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
							
							<div class="is-column-content" @keyup.esc="close(cell)" :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-if="cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return !stopRerender && !cell.stopRerender }, created: getCreatedComponent(row, cell) }"></div>
							<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
								:depth="depth + 1"
								:parameters="parameters"
								:events="events"
								:ref="page.name + '_' + cell.id + '_rows'"
								:local-state="getLocalState(row, cell)"
								:page-instance-id="pageInstanceId"
								:stop-rerender="stopRerender"
								@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
						</component>
					</n-absolute>
					<template v-else>
						<component :is="cellTagFor(row, cell)" :style="getStyles(cell)" 
								v-show="!edit || !row.collapsed"
								:id="page.name + '_' + row.id + '_' + cell.id" 
								:class="$window.nabu.utils.arrays.merge([{'clickable': hasCellClickEvent(cell)}, {'is-page-column': edit || !cell.target || cell.target == 'page', 'page-prompt': cell.target == 'prompt' || cell.target == 'sidebar' || cell.target == 'absolute' }, cell.class ? $services.page.interpret(cell.class, $self) : null, {'has-page': hasPageRoute(cell), 'is-root': root}, {'is-empty': edit && !cell.alias && (!cell.rows || !cell.rows.length) } ], cellClasses(cell))" 
								:key="cellId(cell)"
								:cell-key="'page_' + pageInstanceId + '_cell_' + cell.id"
								@click="clickOnCell(row, cell)"
								@click.ctrl="goto($event, row, cell)"
								@click.meta="goto($event, row, cell)"
								@mouseout="mouseOut($event, row, cell)"
								@mouseover="mouseOver($event, row, cell)"
								@dragend="$services.page.clearDrag($event)"
								@dragover="dragOverCell($event, row, cell)"
								@dragexit="dragExitCell($event, row, cell)"
								@drop="dropCell($event, row, cell)"
								v-auto-close="cell.state.openTrigger ? function(inside) { autocloseCell(row, cell, inside) } : null"
								:target="cell"
								:edit="edit"
								:page="page"
								:child-components="$services.page.calculateArisComponents(cell.aris, cell.renderer, $self)">
							<div v-if="cell.customId" class="is-anchor" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
							
							<div class="is-column-content" @click="clickOnContentCell(row, cell)" @keyup.esc="close(cell)" :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-if="cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return !stopRerender && !cell.stopRerender }, created: getCreatedComponent(row, cell) }"></div>
							<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
								:depth="depth + 1"
								:parameters="parameters"
								:events="events"
								:ref="page.name + '_' + cell.id + '_rows'"
								:local-state="getLocalState(row, cell)"
								:page-instance-id="pageInstanceId"
								:stop-rerender="stopRerender"
								@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
						</component>
					</template>
				</template>
			</template>
		</component>
	</component>
</template>

<template id="n-prompt">
	<div class="is-modal">
		<div class="is-modal-content" v-auto-close="function() { if (autoclose) $emit('close') }">
			<slot></slot>
		</div>
	</div>
</template>

<template id="n-absolute">
	<div class="n-absolute" :style="getStyles()" v-auto-close="function() { if (autoclose) $emit('close') }">
		<div class="n-absolute-content">
			<slot></slot>
		</div>
	</div>
</template>

<template id="aris-editor">
	<div class="aris-editor">
		<n-collapsible v-for="childComponent in childComponents" :only-one-open="true" class="is-highlight-left is-color-primary-light" :title="childComponent.title" :after="childComponent.component">
			<ul class="is-menu is-variant-toolbar is-align-end is-spacing-horizontal-right-small" slot="buttons">
				<li class="is-column"><button class="is-button is-variant-primary-outline is-size-xsmall has-tooltip" @click="saveAsDefaultAris(childComponent)"><icon name="save"/><span class="is-tooltip is-position-left">Save as default</span></button></li>
				<li class="is-column"><button class="is-button is-variant-primary-outline is-size-xsmall has-tooltip" @click="clearOptions(childComponent)"><icon name="undo"/><span class="is-tooltip is-position-left">Clear settings</span></button></li>
			</ul>
			<div class="is-column is-spacing-medium">
				<n-form-combo v-model="container.components[childComponent.name].variant" label="Variant" :filter="getAvailableVariantNames.bind($self, childComponent)" after="Choose the main variant of this component"
					:placeholder="childComponent.defaultVariant ? childComponent.defaultVariant : childComponent.name"
					empty-value="No variants available"
					@input="container.components[childComponent.name].modifiers.splice(0)"/>
			</div>
			<n-collapsible v-if="getAvailableModifierNames(childComponent).length > 0" title="modifier" class="is-highlight-left is-color-secondary-light" 
					content-class="is-spacing-medium is-spacing-vertical-gap-xsmall"
					:after="listActiveModifiers(childComponent)"
					@show="conditioning = null">
				<div class="is-row" v-for="(modifier, index) in getAvailableModifierNames(childComponent)">
					<n-form-checkbox v-if="conditioning != modifier" :value="isActiveModifier(childComponent, modifier)" :label="modifier"
						@input="function() { toggleModifier(childComponent, modifier) }"
						class="is-spacing-vertical-none"/>
					<n-form-text v-model="container.components[childComponent.name].conditions[modifier]" v-else class="is-size-small is-border-underline" placeholder="Condition"/>
					<div class="is-row is-position-right is-align-cross-end" v-if="isActiveModifier(childComponent, modifier)">
						<ul v-if="conditioning == modifier" class="is-menu is-variant-toolbar">
							<li class="is-column"><button class="is-button is-size-xsmall is-variant-primary-outline" @click="conditioning = null">Save</button></li>
							<li class="is-column"><button class="is-button is-size-xsmall is-variant-danger-outline" @click="container.components[childComponent.name].conditions[modifier] = null; conditioning = null">Clear</button></li>
						</ul>
						<ul v-else class="is-menu is-variant-toolbar">
							<li class="is-column"><button class="is-button is-size-xsmall is-variant-primary-outline" @click="conditioning = modifier">Set Condition</button></li>
							<li class="is-column" v-if="hasCondition(childComponent, modifier)"><button class="is-button is-size-xsmall is-variant-danger-outline has-tooltip" @click="container.components[childComponent.name].conditions[modifier] = null">Clear Condition</button></li>
						</ul>
					</div>
				</div>
			</n-collapsible>
			<n-collapsible v-for="dimension in getAvailableDimensions(childComponent)" :only-one-open="true" :title="dimension.name" class="is-highlight-left is-color-secondary-light" 
					content-class="is-spacing-medium is-spacing-vertical-gap-none"
					:after="listActiveOptions(childComponent, dimension)"
					@show="conditioning = null">
				<div class="is-row" v-for="option in dimension.options">
					<n-form-checkbox v-if="conditioning != dimension.name + '_' + option" :value="isActiveOption(childComponent, dimension, option)" @input="function() { toggleOption(childComponent, dimension, option) }"
						:label="prettifyOption(option)"/>
					<n-form-text v-model="container.components[childComponent.name].conditions[dimension.name + '_' + option]" v-else class="is-size-small is-border-underline" placeholder="Condition"/>
					<div class="is-row is-position-right is-align-cross-end" v-if="isActiveOption(childComponent, dimension, option)">
						<ul v-if="conditioning == dimension.name + '_' + option" class="is-menu is-variant-toolbar">
							<li class="is-column"><button class="is-button is-size-xsmall is-variant-primary-outline" @click="conditioning = null">Save</button></li>
							<li class="is-column"><button class="is-button is-size-xsmall is-variant-danger-outline" @click="container.components[childComponent.name].conditions[dimension.name + '_' + option] = null; conditioning = null">Clear</button></li>
						</ul>
						<ul v-else class="is-menu is-variant-toolbar">
							<li class="is-column"><button class="is-button is-size-xsmall is-variant-primary-outline" @click="conditioning = dimension.name + '_' + option">Set Condition</button></li>
							<li class="is-column" v-if="hasCondition(childComponent, dimension.name + '_' + option)"><button class="is-button is-size-xsmall is-variant-danger-outline has-tooltip" @click="container.components[childComponent.name].conditions[dimension.name + '_' + option] = null">Clear Condition</button></li>
						</ul>
					</div>
				</div>
			</n-collapsible>
		</n-collapsible>
	</div>
</template>
<template id="page-sidemenu">
	<div class="is-column is-pattern-basic-alternating">
		<div v-for="row in rows" class="is-column is-spacing-small is-spacing-horizontal-right-none is-spacing-vertical-gap-small" :class="{'is-selected': selected && selected.id == row.id}">
			<div class="is-row">
				<div @mouseout="mouseOut($event, row)"
						@dragover="acceptDragRow($event, row)"
						@dragend="$services.page.clearDrag($event)"
						@drop="dropRow($event, row)"
						@mouseover="mouseOver($event, row)" 
						@keydown.f2.prevent="function() { editing = null; aliasing = row.id }"
						class="is-row is-fill-normal"
						tabindex="0">
					<button class="is-button is-variant-ghost is-size-xsmall" @click="toggleRow(row)"><icon :name="opened.indexOf(row.id) >= 0 ? 'chevron-down' : 'chevron-right'"/></button>
					<n-form-text v-if="aliasing == row.id" v-model="row.name" class="is-variant-inline is-size-xsmall" :placeholder="row.name ? row.name : ($services.page.getRenderer(row.renderer) ? $services.page.getRenderer(row.renderer).title : (row.class ? row.class : row.id))" :autofocus="true"
						:commit="true"
						@commit="function() { aliasing = null }"
						@keydown.escape="function() { aliasing = null }"/>
					<span class="is-content is-size-xsmall is-fill-normal is-position-cross-center" @click="selectRow(row)" 
						@dragstart="dragRow($event, row)"
						:draggable="true" 
						v-else
						@click.ctrl="scrollIntoView(row)">{{row.name ? row.name : ($services.page.getRenderer(row.renderer) ? $services.page.getRenderer(row.renderer).title : row.id)}}</span>
				</div>
				<ul class="is-menu is-variant-toolbar is-position-right is-spacing-horizontal-right-small">
					<li class="is-column" v-if="$services.page.useAris"><button class="is-button is-variant-warning-outline is-size-xsmall has-tooltip" @click="rotate(row)"><icon name="undo"/><span class="is-tooltip is-position-bottom">Rotate row</span></button></li>
					<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-xsmall" @click="up(row)"><icon name="chevron-circle-up"/></button></li>
					<li class="is-column"><button class="is-button is-variant-secondary-outline is-size-xsmall" @click="down(row)"><icon name="chevron-circle-down"/></button></li>
					<li class="is-column"><button class="is-button is-size-xsmall is-color-primary-outline has-tooltip" @click="row.collapsed = !row.collapsed"><icon :name="row.collapsed ? 'eye-slash': 'eye'"/><span class="is-tooltip is-position-bottom">{{ row.collapsed ? "Show" : "Hide" }}</span></button></li>
					<li class="is-column" v-if="false"><button class="is-button is-size-xsmall is-color-secondary-outline" @click="showHtml(row)"><icon name="code" /></button></li>
					<li class="is-column"><button class="is-button is-size-xsmall is-color-primary-outline has-tooltip" @click="addCell(row)"><icon name="plus"/><span class="is-tooltip is-position-bottom">Add cell</span></button></li>
					<li class="is-column"><button class="is-button is-size-xsmall is-color-primary-outline has-tooltip" @click="copyRow(row)"><icon name="copy"/><span class="is-tooltip is-position-left">Copy row</span></button></li>
					<li class="is-column"><button class="is-button is-variant-warning has-tooltip is-size-xsmall" v-if="$services.page.copiedCell" @click="pasteCell(row)"><icon name="paste"/><span class="is-tooltip is-position-left">Paste Cell</span></button></li>
					<li class="is-column"><button class="is-button is-size-xsmall is-color-danger-outline" @click="$emit('removeRow', row)"><icon name="times"></span></button></li>
				</ul>
			</div>
			<div v-show="row.cells && row.cells.length && opened.indexOf(row.id) >= 0" class="is-column is-pattern-basic-alternating">
				<div v-for="cell in row.cells" class="is-column is-spacing-small is-sidemenu-cell is-spacing-horizontal-right-none" :class="{'is-selected': selected && selected.id == cell.id}">
					<div class="is-row">
						<div class="page-sideentry" @mouseout="mouseOut($event, row, cell)" 
								:key="'sidemenu-' + row.id + '_' + cell.id"
								@dragend="$services.page.clearDrag($event)"
								@dragover="acceptDragCell($event, row, cell)"
								@drop="dropCell($event, row, cell)"
								@mouseover="mouseOver($event, row, cell)"
								class="is-row is-fill-normal is-spacing-horizontal-gap-small is-no-outline"
								@click.ctrl="scrollIntoView(row, cell)"
								@click="selectCell(row, cell)"
								@dragstart="dragCell($event, row, cell)"
								:draggable="true"
								@keydown.f2.prevent="function() { aliasing = null; editing = cell.id; requestFocus() }"
								@keydown.f3.prevent="function() { editing = null; aliasing = cell.id; requestFocus() }"
								@keydown.esc.prevent="function() { editing = null; aliasing = null }"
								@keydown.ctrl.up="left(row, cell)"
								@keydown.ctrl.down="right(row, cell)"
								:ref="'cell_' + cell.id"
								tabindex="0">
							<icon name="cube" class="is-size-xsmall is-position-cross-center" @click.native="function() { editing = null; aliasing = aliasing == cell.id ? null : cell.id }" v-if="false"/>
							<icon name="cube" class="is-size-xsmall is-position-cross-center" />
							<n-form-text v-if="editing == cell.id" v-model="cell.name" class="is-variant-inline is-size-xsmall" :placeholder="cell.alias ? $services.page.prettifyRouteAlias(cell.alias) : cell.id" :autofocus="true"
								ref="editor"
								:commit="true"
								@commit="function() { editing = null; requestFocusCell(cell) }"
								@keydown.escape="function() { editing = null; requestFocusCell(cell) }"/>
							<n-form-combo v-if="aliasing == cell.id" class="is-variant-inline is-size-xsmall is-fill-normal is-spacing-horizontal-right-medium" :filter="$services.page.getNamedRoutes" v-model="cell.alias"
								ref="aliaser"
								:extracter="function(x) { return x.alias }"
								:formatter="function(x) { return $services.page.prettifyRouteAlias(x.alias) }"
								:key="'page_' + pageInstanceId + '_' + cell.id + '_alias'" 
								@keydown.escape="function() { aliasing = null; requestFocusCell(cell) }" 
								@input="$services.page.slowNormalizeAris(page, cell)"/>
							<span v-if="editing != cell.id && aliasing != cell.id" class="is-content is-size-xsmall is-position-cross-center" @click="selectCell(row, cell)" 
								>{{cell.name ? cell.name : (cell.alias ? $services.page.prettifyRouteAlias(cell.alias) : ($services.page.getRenderer(cell.renderer) ? $services.page.getRenderer(cell.renderer).title : cell.id))}}</span>
							<button class="is-button is-size-xxsmall is-variant-ghost is-position-cross-center" @click="function() { aliasing = null; editing = cell.id }" v-if="false && aliasing != cell.id && editing != cell.id"><icon name="pencil-alt"/></button>
						</div>
						<ul class="is-menu is-variant-toolbar is-position-right is-spacing-horizontal-right-small">
							<li class="is-column"><button class="is-button is-variant-warning-outline is-size-xsmall has-tooltip" @click="wrapCell(row, cell)"><icon name="chevron-circle-right"/><span class="is-tooltip is-position-bottom">Wrap cell</span></button></li>
							<li class="is-column"><button class="is-button is-color-secondary-outline is-size-xsmall has-tooltip" @click="left(row, cell)" v-if="row.cells.length >= 2"><icon name="chevron-circle-up"/></button></li>
							<li class="is-column"><button class="is-button is-color-secondary-outline is-size-xsmall has-tooltip" @click="right(row, cell)" v-if="row.cells.length >= 2"><icon name="chevron-circle-down"/></button></li>
							<li class="is-column"><button class="is-button is-color-primary-outline is-size-xsmall has-tooltip" @click="addRow(cell)"><icon name="plus"/><span class="is-tooltip">Add Row</span></button></li>
							<li class="is-column"><button class="is-button is-color-primary-outline is-size-xsmall has-tooltip" @click="copyCell(cell)"><icon name="copy"/><span class="is-tooltip">Copy Cell</span></button></li>
							<li class="is-column"><button class="is-button is-color-warning is-size-xsmall has-tooltip" @click="pasteRow(cell)" v-if="$services.page.copiedRow"><icon name="paste"/><span class="is-tooltip">Paste Row</span></button></li>
							<li class="is-column" v-if="false && hasConfigure(cell)"><button class="is-button is-color-primary-outline is-size-xsmall has-tooltip" @click="configure(cell)"><icon name="cog"/><icon name="paste"/><span class="is-tooltip">Configure></span></button></li>
							<li class="is-column" v-if="false"><button class="is-button is-color-secondary-outline is-size-xsmall" @click="showHtml(row, cell)"><icon name="code"/></button></li>
							<li class="is-column"><button class="is-button is-color-danger-outline is-size-xsmall" @click="removeCell(row.cells, cell)"><icon name="times"/></button></li>
						</ul>
					</div>
					<page-sidemenu v-show="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" v-bubble:select :selected="selected"
						@open="function() { if (opened.indexOf(row) < 0) opened.push(row.id) }"
						v-bubble:open
						@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
				</div>
			</div>
		</div>
	</div>
</template>


  
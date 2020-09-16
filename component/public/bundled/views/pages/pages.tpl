<template id="nabu-pages">
	<div class="pages">
		<n-form class="settings pages" v-if="$services.page.canEdit()" mode="component" ref="form">
			<n-prompt v-if="showing">
				<n-form class="layout2">
					<n-form-section>
						<n-form-text v-for="key in Object.keys(parameters)" v-model="parameters[key]" :label="key"/>
					</n-form-section>
					<footer class="global-actions">
						<a href="javascript:void(0)" @click="showing=false">Cancel</a>
						<button @click="doRoute">Open Page</button>
					</footer>
				</n-form>
			</n-prompt>
			<h1>{{ $services.page.title ? $services.page.title : 'My Website'}}<span class="subscript">Powered by Nabu</span></h1>
			<div class="panes">
				<div class="pane">
					<n-collapsible title="Main Settings" class="main">
						<div class="padded-content">
							<n-form-text v-model="$services.page.title" label="The website title as shown in the top bar" :timeout="600" @input="$services.page.saveConfiguration"/>
							<n-form-combo v-model="$services.page.home" label="Guest Home Page" :filter="getRoutes" @input="$services.page.saveConfiguration"/>
							<n-form-combo v-model="$services.page.homeUser" label="User Home Page" :filter="getRoutes" @input="$services.page.saveConfiguration"/>
							<n-form-text v-model="$services.page.googleSiteVerification" label="Google site verification code" :timeout="600" @input="$services.page.saveConfiguration"/>
							<n-form-text v-model="$services.page.geoRefusalTimeout" label="Timeout (in hours) that a geo refusal is stored" info="No timeout means we have no geo enabled" type="number" :timeout="600" @input="$services.page.saveConfiguration"/>
						</div>
						<n-collapsible title="Branding" class="main">
							<div class="padded-content">
								<n-form-text v-model="$services.page.branding.favicon" placeholder="/resources/images/logo.png" label="The location of the favicon" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-text v-model="$services.page.branding.title" :placeholder="$services.page.title" label="The meta title for your application" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-text v-model="$services.page.branding.description" label="The meta description for your application" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-text v-model="$services.page.branding.image" placeholder="/resources/images/hero.png" label="The meta image for your application, minimum 1200×630 pixels, max 1mb" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-text v-model="$services.page.branding.imageAlt" label="Alternative text for your main image" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-text v-model="$services.page.branding.facebookAppId" label="Your facebook app id" info="Mostly interesting for analytics" placeholder="your_app_id" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-text v-model="$services.page.branding.twitterUserName" placeholder="@website-username" info="Mostly interesting for analytics" label="Your facebook app id" :timeout="600" @input="$services.page.saveConfiguration"/>
							</div>
						</n-collapsible>
						<n-collapsible class="layout2 list-item" title="Application Properties">
							<div class="padded-content">
								<div class="list-row" v-for="property in $services.page.properties">
									<n-form-text v-model="property.key" label="Key" :timeout="600" @input="$services.page.saveConfiguration"/>
									<n-form-text v-model="property.value" label="Value" :timeout="600" @input="$services.page.saveConfiguration"/>
									<span @click="$services.page.properties.splice($services.page.properties.indexOf(property), 1); $services.page.saveConfiguration()" class="fa fa-times"></span>
								</div>
							</div>
							<div class="list-actions">
								<button @click="$services.page.properties.push({key:null,value:null})"><span class="fa fa-plus"></span>property</button>
							</div>
						</n-collapsible>
						<n-collapsible class="layout2 list-item" title="Application Environment Specific Properties">
							<div class="padded-content">
								<div class="list-row" v-for="property in $services.page.environmentProperties">
									<n-form-text v-model="property.key" label="Key" :timeout="600" @input="$services.page.saveConfiguration"/>
									<n-form-text v-model="property.value" label="Value" :timeout="600" @input="$services.page.saveConfiguration"/>
									<span @click="$services.page.environmentProperties.splice($services.page.environmentProperties.indexOf(property), 1); $services.page.saveConfiguration()" class="fa fa-times"></span>
								</div>
							</div>
							<div class="list-actions">
								<button @click="$services.page.environmentProperties.push({key:null,value:null})"><span class="fa fa-plus"></span> environment specific property</button>
							</div>
						</n-collapsible>
					</n-collapsible>
					<n-collapsible title="Devices" class="main">
						<div class="list-actions">
							<button @click="$services.page.devices.push({name:null,width:0})">Add device</button>
						</div>
						<div class="padded-content">
							<div class="list-row" v-for="device in $services.page.devices">
								<n-form-text v-model="device.name" :required="true" label="Device Name" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-text v-model="device.width" type="number" label="Width" :timeout="600" @input="$services.page.saveConfiguration"/>
								<span @click="$services.page.devices.splice($services.page.devices.indexOf(device), 1); $services.page.saveConfiguration()" class="fa fa-times"></span>
							</div>
						</div>
					</n-collapsible>
					<n-collapsible title="State" class="main">
						<div class="list-actions">
							<button @click="$services.page.applicationState.push({name:null,operation:null})">Add State</button>
						</div>
						<div class="padded-content">
							<div class="list-row" v-for="state in $services.page.applicationState">
								<n-form-text v-model="state.name" :required="true" label="State Name" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-combo v-model="state.operation" :filter="$services.page.getStateOperations" label="Operation" @input="$services.page.saveConfiguration"/>
								<span @click="$services.page.applicationState.splice($services.page.applicationState.indexOf(state), 1); $services.page.saveConfiguration()" class="fa fa-times"></span>
							</div>
						</div>
					</n-collapsible>
					<n-collapsible title="Pages" class="list">
						<footer class="list-actions">
							<button @click="create">Create New Page</button>
						</footer>
						<n-form-section v-for="category in categories" :key="category" :ref="'category_' + category">
							<h2>{{category ? category : 'Uncategorized'}} <span class="fa fa-copy" @click="copyCategory(category)"></span></h2>
							<n-collapsible :title="page.name" v-for="page in getPagesFor(category)" class="layout2 list-item" :key="page.id">
								<n-form-section>
									<n-form-text :value="page.name" label="Name (lowercase and dashes)" :required="true" :timeout="600" @input="function(newValue) { updatePageName(page, newValue) }" :validator="customNameValidator"/>
									<n-form-text v-model="page.content.category" label="Category" :timeout="600" @input="save(page)"/>
									<n-form-switch label="Is initial" v-model="page.content.initial" @input="save(page)"/>
									<n-form-switch label="Is slow" v-if="!page.content.initial" v-model="page.content.slow" @input="save(page)"/>
									<n-form-text v-model="page.content.path" v-if="!page.content.initial" label="Path" :timeout="600" @input="save(page)"/>
									<n-form-combo v-model="page.content.pageParent" label="Page Parent" :timeout="600" @input="save(page)"
										:filter="getRoutes"/>
									<n-form-text v-model="page.content.defaultAnchor" label="Default Content Anchor" :timeout="600" @input="save(page)"/>
									<!-- support for pages with input values -->
								</n-form-section>
								<div class="global-actions">
									<button @click="copy(page)">Copy</button>
									<button v-if="!page.content.initial" @click="route(page)">View</button>
									<button @click="remove(page)">Delete</button>
								</div>
							</n-collapsible>
						</n-form-section>
					</n-collapsible>
					<n-collapsible title="Styling" class="list">
						<footer class="list-actions">
							<button @click="$services.page.createStyle">Create New Stylesheet</button>
							<div class="danger message" v-if="$services.page.cssError">{{$services.page.cssError}}</div>
						</footer>
						<n-collapsible :title="style.name" v-for="style in $services.page.styles.filter(function(x) { return x.name.substring(0, 1) != '$' })" class="page-cell layout2 list-item" :key="style.id">
							<n-form-text v-if="false" :required="true" v-model="style.name" label="Name" @input="$services.page.updateCss(style)" :timeout="600"/>
							<n-form-text type="color" v-model="lastColor[style.name]" :timeout="600" @input="function(value) { insertColor(style, value) }" label="Color Picker"/>
							<n-ace v-model="style.content" :timeout="600" @input="$services.page.saveStyle(style)" :ref="'editors_' + style.name"/>
						</n-collapsible>
					</n-collapsible>
					<n-collapsible title="Functions" class="list">
						<footer class="list-actions">
							<button @click="$services.page.createFunction">Create New Function</button>
						</footer>
						<n-collapsible :title="transformer.id" v-for="transformer in $services.page.functions" class="page-cell layout2 list-item">
							<n-collapsible title="Input" class="page-cell layout2 list-item io">
								<div class="list-actions">
									<button @click="addFunctionParameter(transformer, 'inputs')">Add Input Parameter</button>
								</div>
								<n-collapsible class="list-item" v-for="parameter in transformer.inputs" :title="parameter.name">
									<n-form-text v-model="parameter.name" :required="true" label="Name"/>
									<n-form-combo v-model="parameter.type" label="Type" :nillable="false" :filter="$services.page.getAvailableTypes"/>
									<n-form-combo v-model="parameter.format" label="Format" v-if="parameter.type == 'string'" :items="['date-time', 'uuid', 'uri', 'date', 'password']"/>
									<n-form-text v-model="parameter.default" label="Default Value"/>
									<div class="list-item-actions">
										<button @click="transformer.inputs.splice(transformer.inputs.indexOf(parameter), 1)"><span class="fa fa-trash"></span></button>	
									</div>
								</n-collapsible>
							</n-collapsible>
							<n-collapsible title="Output" class="page-cell layout2 list-item io" v-if="!transformer.async">
								<div class="list-actions">
									<button @click="addFunctionParameter(transformer, 'outputs')">Add Output Parameter</button>
								</div>
								<n-collapsible class="list-item" v-for="parameter in transformer.outputs" :title="parameter.name">
									<n-form-text v-model="parameter.name" :required="true" label="Name"/>
									<n-form-combo v-model="parameter.type" label="Type" :nillable="false" :filter="$services.page.getAvailableTypes"/>
									<n-form-combo v-model="parameter.format" label="Format" v-if="parameter.type == 'string'" :items="['date-time', 'uuid', 'uri', 'date', 'password']"/>
									<n-form-text v-model="parameter.default" label="Default Value"/>
									<div class="list-item-actions">
										<button @click="transformer.outputs.splice(transformer.outputs.indexOf(parameter), 1)"><span class="fa fa-trash"></span></button>	
									</div>
								</n-collapsible>
							</n-collapsible>
							<n-ace v-model="transformer.content" :ref="'editors_' + transformer.id"/>
							<n-form-switch v-model="transformer.async" label="Asynchronous"/>
							<button @click="$services.page.saveFunction(transformer)">Save</button>
						</n-collapsible>
					</n-collapsible>
				</div>
				<div class="pane">
					<n-collapsible title="Imports" class="main">
						<div class="list-actions">
							<button @click="$services.page.imports.push({link:null, type: 'javascript', async: true})"><span class="fa fa-plus"></span>Import</button>
						</div>
						<div class="padded-content">
							<div class="list-row" v-for="single in $services.page.imports">
								<n-form-text v-model="single.link" :required="true" label="Link" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-combo v-if="false" v-model="single.type" :items="['javascript', 'css']" label="Type" :timeout="600" @input="$services.page.saveConfiguration"/>
								<n-form-switch v-model="single.async" label="Asynchronous" :timeout="600" @input="$services.page.saveConfiguration"/>
								<span @click="$services.page.imports.splice($services.page.imports.indexOf(single), 1); $services.page.saveConfiguration()" class="fa fa-times"></span>
							</div>
						</div>
					</n-collapsible>
					
					<n-collapsible title="Installed Bundles" class="main">
						
					</n-collapsible>
				</div>
			</div>
		</n-form>
		<div v-else>%{You don't have permission to view this page, you might want to try to <a v-route:login>log in</a> as a user with sufficient privileges}</div>
	</div>
</template>

<template id="nabu-create-page">
	<n-form class="nabu-create-page layout2" ref="form">
		<n-form-section>
			<n-form-combo v-model="category" label="Category" :required="true" :filter="checkCategory"/>
			<n-form-text v-model="name" label="Name" :required="true" :validator="validator"/>
		</n-form-section>
		<footer>
			<a href="javascript:void(0)" @click="$reject">Cancel</a>
			<button @click="$resolve({category:category, name:name})">Add</button>
		</footer>
	</n-form>
</template>

<template id="nabu-pages-paste">
	<n-form class="nabu-pages-paste layout2" ref="form">
		<n-form-section>
			<n-form-text v-model="category" label="Paste in category" :required="true"/>
			<n-form-text v-model="name" label="Paste with name" :required="true"/>
		</n-form-section>
		<footer>
			<a href="javascript:void(0)" @click="$reject">Cancel</a>
			<button @click="$resolve({category:category, name:name})">Add</button>
		</footer>
	</n-form>
</template>
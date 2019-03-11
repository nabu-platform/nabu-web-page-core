<template id="nabu-pages">
	<div class="pages">
		<n-form class="layout2 settings pages" v-if="$services.page.canEdit()">
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
			<h1>{{ $services.page.title ? $services.page.title : 'My Website'}}</h1>
			<div class="introduction" v-if="false">
				<p>Welcome to the site editor, here you can create and edit your site content.</p>
			</div>
			<n-collapsible title="Main Settings" class="main">
				<n-form-section>
					<n-form-text v-model="$services.page.title" label="Website Title" :timeout="600" @input="$services.page.saveConfiguration"/>
					<n-form-combo v-model="$services.page.home" label="Home Page" :filter="getRoutes" @input="$services.page.saveConfiguration"/>
					<div class="list-actions">
						<button @click="$services.page.properties.push({key:null,value:null})">Add property</button>
					</div>
					<div class="list-row" v-for="property in $services.page.properties">
						<n-form-text v-model="property.key" label="Key" :timeout="600" @input="$services.page.saveConfiguration"/>
						<n-form-text v-model="property.value" label="Value" :timeout="600" @input="$services.page.saveConfiguration"/>
						<button @click="$services.page.properties.splice($services.page.properties.indexOf(property), 1); $services.page.saveConfiguration()"><span class="fa fa-trash"></span></button>
					</div>
				</n-form-section>
			</n-collapsible>
			<n-collapsible title="Imports" class="main">
				<n-form-section>
					<div class="list-actions">
						<button @click="$services.page.imports.push({link:null, type: 'javascript', async: true})">Add Link</button>
					</div>
					<div class="list-row" v-for="single in $services.page.imports">
						<n-form-text v-model="single.link" :required="true" label="Link" :timeout="600" @input="$services.page.saveConfiguration"/>
						<n-form-combo v-if="false" v-model="single.type" :items="['javascript', 'css']" label="Type" :timeout="600" @input="$services.page.saveConfiguration"/>
						<n-form-switch v-model="single.async" label="Asynchronous" :timeout="600" @input="$services.page.saveConfiguration"/>
						<button @click="$services.page.imports.splice($services.page.imports.indexOf(single), 1); $services.page.saveConfiguration()"><span class="fa fa-trash"></span></button>
					</div>
				</n-form-section>
			</n-collapsible>
			<n-collapsible title="Devices" class="main">
				<n-form-section>
					<div class="list-actions">
						<button @click="$services.page.devices.push({name:null,width:0})">Add device</button>
					</div>
					<div class="list-row" v-for="device in $services.page.devices">
						<n-form-text v-model="device.name" :required="true" label="Device Name" :timeout="600" @input="$services.page.saveConfiguration"/>
						<n-form-text v-model="device.width" type="number" label="Width" :timeout="600" @input="$services.page.saveConfiguration"/>
						<button @click="$services.page.devices.splice($services.page.devices.indexOf(device), 1); $services.page.saveConfiguration()"><span class="fa fa-trash"></span></button>
					</div>
				</n-form-section>
			</n-collapsible>
			<n-collapsible title="Pages" class="list">
				<footer class="list-actions">
					<button @click="create">Create New Page</button>
				</footer>
				<div v-for="category in categories" :key="category" :ref="'category_' + category">
					<h2>{{category ? category : 'Uncategorized'}} <span class="fa fa-clipboard" @click="copyCategory(category)"></span></h2>
					<n-collapsible :title="page.name" v-for="page in getPagesFor(category)" class="layout2 list-item" :key="page.id">
						<n-form-section>
							<n-form-text :value="page.name" label="Name (camelCase only!)" :required="true" :timeout="600" @input="function(newValue) { $services.page.rename(page, newValue) }"/>
							<n-form-text v-model="page.content.category" label="Category" :timeout="600" @input="save(page)"/>
							<n-form-switch label="Is initial" v-model="page.content.initial" @input="save(page)"/>
							<n-form-switch label="Is slow" v-if="!page.content.initial" v-model="page.content.slow" @input="save(page)"/>
							<n-form-text v-model="page.content.path" v-if="!page.content.initial" label="Path" :timeout="600" @input="save(page)"/>
							<!-- support for pages with input values -->
						</n-form-section>
						<div class="global-actions">
							<button @click="copy(page)">Copy</button>
							<button v-if="page.content.path && !page.content.initial" @click="route(page)">View</button>
							<button @click="remove(page)">Delete</button>
						</div>
					</n-collapsible>
				</div>
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
		</n-form>
		<div v-else>%{You don't have permission to view this page, you might want to try to <a v-route:login>log in</a> as a user with sufficient privileges}</div>
	</div>
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
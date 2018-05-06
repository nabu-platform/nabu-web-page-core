<template id="nabu-cms-pages">
	<n-form class="layout2 nabu-pages settings">
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
		<n-collapsible title="Pages" class="list">
			<footer class="list-actions">
				<button @click="create">Create New Page</button>
			</footer>
			<div v-for="category in categories" :key="category" :ref="'category_' + category">
				<h2>{{category ? category : 'Uncategorized'}} <span class="fa fa-clipboard" @click="copyCategory(category)"></span></h2>
				<n-collapsible :title="page.name" v-for="page in getPagesFor(category)" class="layout2 list-item" :key="page.id">
					<n-form-section>
						<n-form-text :value="page.name" label="Name" :required="true" :timeout="600" @input="function(newValue) { $services.page.rename(page, newValue) }"/>
						<n-form-text v-model="page.content.category" label="Category" :timeout="600" @input="save(page)"/>
						<n-form-switch label="Is initial" v-model="page.content.initial" @input="save(page)"/>
						<n-form-switch label="Is slow" v-if="!page.content.initial" v-model="page.content.slow" @input="save(page)"/>
						<n-form-text v-model="page.content.path" v-if="!page.content.initial" label="Path" :required="true" :timeout="600" @input="save(page)"/>
						<!-- support for pages with input values -->
					</n-form-section>
					<div class="global-actions">
						<button v-if="page.content.path && !page.content.initial" @click="route(page)">View</button>
						<button @click="remove(page)">Delete</button>
					</div>
				</n-collapsible>
			</div>
		</n-collapsible>
		<n-collapsible title="Styling" class="list" v-if="false" comment="enable at a later date when it is clearer how all the files will work">
			<footer class="list-actions">
				<button @click="$services.page.createStyle">Create New Page</button>
				<button @click="$services.page.compileCss" v-if="false">Compile New Css</button>
				<button @click="$services.page.saveCompiledCss" v-if="false" :disabled="!$services.page.lastCompiled">Save New Css</button>
			</footer>
			<n-collapsible :title="style.name ? style.name : 'Unnamed'" v-for="style in $services.page.styles" class="page-cell layout2 list-item" :key="style.id">
				<n-form-text :required="true" v-model="style.name" label="Name" @input="$services.page.updateCss(style)" :timeout="600"/>
				<n-form-switch :value="style.title == 'utility'" label="Is utility file" @input="function(newValue) { style.title = newValue ? 'utility' : 'page' }"/>
				<n-form-text type="color" v-model="lastColor[style.name]" :timeout="600" @input="function(value) { insertColor(style, value) }" label="Color Picker"/>
				<n-ace v-model="style.description" :timeout="600" @input="$services.page.updateCss(style, true)" :ref="'editors_' + style.name"/>
			</n-collapsible>
		</n-collapsible>
	</n-form>
</template>


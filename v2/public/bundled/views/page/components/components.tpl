<template id="page-components-overview">
	<div class="page-components-overview">
		<ul class="is-menu is-variant-toolbar is-spacing-horizontal-sides-medium">
			<li class="is-column"><button class="is-button is-border-underline is-size-small" @click="selected = 'components'" :class="{'is-active': selected == 'components'}">Components</button></li>
			<li class="is-column"><button class="is-button is-border-underline is-size-small" @click="selected = 'templates'" :class="{'is-active': selected == 'templates'}">Templates</button></li>
			<li class="is-column"><button class="is-button is-border-underline is-size-small" @click="selected = 'operations'" :class="{'is-active': selected == 'operations'}">Operations</button></li>
		</ul>
		<p class="is-p is-size-small is-color-light is-spacing-medium">Drag and drop a component of your choice into a row.</p>
		<div v-if="selected == 'components'">
			<n-collapsible :only-one-open="true" v-for="category in componentCategories" :title="prettyPrint(category)" content-class="is-pattern-underline">
				<div class="is-row is-height-min4 is-align-cross-center is-spacing-horizontal-medium is-spacing-vertical-small is-highlight-light is-cursor-pointer" v-for="(component, index) in getComponentCategory(category)" :draggable="true"
						@dragstart="dragComponent($event, component)">
					<img :draggable="false" :src="'${server.root()}resources/' + component.icon" class="is-column is-width-1" v-if="component.icon && component.icon.match(/^.*\.[^.]+$/)"/>
					<icon v-else-if="component.icon" :name="component.icon" class="is-column is-width-1"/>
					<div class="is-column is-width-11">
						<h5 class="is-h5 is-size-medium">{{ component.name }}</h5>
						<p class="is-p is-size-xsmall" v-if="component.description">{{ component.description }}</p>
					</div>
				</div>
			</n-collapsible>
		</div>
		<div v-else-if="selected == 'templates'">
			<n-collapsible class="component-category" v-for="category in templateCategories" :title="prettyPrint(category)" content-class="is-pattern-underline">
				<div class="is-row is-height-min4 is-align-cross-center is-spacing-horizontal-medium is-spacing-vertical-small is-highlight-light is-cursor-pointer" v-for="template in getTemplateCategory(category)" :draggable="true"
						@dragstart="dragTemplate($event, template)">
					<img :draggable="false" :src="'${server.root()}resources/' + template.icon" class="is-column is-width-1" v-if="template.icon && template.icon.match(/^.*\.[^.]+$/)"/>
					<icon v-else-if="template.icon" :name="template.icon" class="is-column is-width-1"/>
					<div class="is-column is-width-11">
						<h5 class="is-h5 is-size-medium">{{ template.name }}</h5>
						<p class="is-p is-size-xsmall" v-if="template.description">{{ template.description }}</p>
					</div>
				</div>
			</n-collapsible>
		</div>
		<div v-else-if="selected == 'operations'">
			<n-collapsible class="component-category" v-for="category in getOperationCategories()" :title="prettyPrint(category)" content-class="is-pattern-underline">
				<div class="is-row is-height-min4 is-align-cross-center is-spacing-horizontal-medium is-spacing-vertical-small is-highlight-light is-cursor-pointer" v-for="operation in getOperationCategory(category)" :draggable="true"
						@dragstart="dragOperation($event, operation)">
					<div class="is-column is-width-11">
						<h5 class="is-h5 is-size-medium">{{ operation.id }}</h5>
						<p class="is-p is-size-xsmall" v-if="operation.summary">{{ operation.summary }}</p>
					</div>
				</div>
			</n-collapsible>
		</div>
	</div>
</template>


<template id="page-components-selector">
	<div class="page-components-selector">
		<h2>Select Component</h2>
		<div class="page-components">
			<div class="page-component" v-for="component in components" @click="$resolve(component)">
				<img :src="'${server.root()}resources/' + component.icon" class="component-icon" v-if="component.icon"/>
				<div class="about">
					<span class="name">{{ component.name }}</span>
					<p class="component-description" v-if="component.description">{{ component.description }}</p>
				</div>
			</div>
		</div>
		<div class="buttons">
			<button @click="$reject()">Cancel</button>
		</div>
	</div>
</template>
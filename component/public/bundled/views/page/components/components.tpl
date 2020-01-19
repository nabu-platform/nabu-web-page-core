<template id="page-components-overview">
	<div class="page-components-overview">
		<div class="tabs">
			<div @click="selected = 'components'" class="tab" :class="{'selected': selected == 'components'}">Components</div>
			<div @click="selected = 'structures'" class="tab" :class="{'selected': selected == 'structures'}">Content</div>
		</div>
		<div v-if="selected == 'components'">
			<n-collapsible class="component-category" v-for="category in componentCategories" :title="prettyPrint(category)">
				<div class="page-component" v-for="component in getComponentCategory(category)" :draggable="true" 
						@dragstart="dragComponent($event, component)">
					<img :draggable="false" :src="'${server.root()}resources/' + component.icon" class="component-icon" v-if="component.icon"/>
					<div class="about">
						<span class="name">{{ component.name }}</span>
						<p class="component-description" v-if="component.description">{{ component.description }}</p>
					</div>
				</div>
			</n-collapsible>
		</div>
		<div v-else-if="selected == 'structures'">
			<n-collapsible class="component-category" v-for="category in structureCategories" :title="prettyPrint(category)">
				<div class="page-structure" v-for="structure in getStructureCategory(category)" :draggable="true" 
						@dragstart="dragStructure($event, structure)">
					<img :draggable="false" :src="'${server.root()}resources/' + structure.icon" class="component-icon" v-if="structure.icon"/>
					<div class="about">
						<span class="name">{{ structure.name }}</span>
						<p class="structure-description" v-if="structure.description">{{ structure.description }}</p>
					</div>
				</div>
			</n-collapsible>
		</div>
	</div>
</template>
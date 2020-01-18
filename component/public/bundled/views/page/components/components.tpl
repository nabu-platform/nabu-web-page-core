<template id="page-components-overview">
	<div class="page-components-overview">
		<n-collapsible class="component-category" v-for="category in categories" :title="prettyPrint(category)">
			<div class="page-component" v-for="component in getCategory(category)" :draggable="true" 
					@dragstart="dragComponent($event, component)">
				<img :src="'${server.root()}resources/' + component.icon" class="component-icon"/>
				<div class="about">
					<span class="name">{{ component.name }}</span>
					<p class="component-description" v-if="component.description">{{ component.description }}</p>
				</div>
			</div>
		</n-collapsible>
	</div>
</template>
<template id="page-image-dynamic">
	<img :src="href"
		class="is-image"
		:class="getChildComponentClasses('image')"
		:title="cell.state.title ? $services.page.interpret($services.page.translate(cell.state.title), $self) : null"/>
</template>

<template id="page-image-dynamic-configure">
	<div class="is-column is-spacing-medium">
		<n-form-combo v-model="cell.state.imageOperation" :filter="$services.page.getBinaryOperations"
			label="Operation to use"
			:formatter="function(x) { return x.id }"
			:extracter="function(x) { return x.id }"/>
			
		<n-page-mapper v-if="cell.state.imageOperation" 
			:to="$services.page.getSwaggerOperationInputDefinition(cell.state.imageOperation)"
			:from="$services.page.getAllAvailableParameters(page)" 
			:key="cell.state.operation + '-image-mapper'"
			v-model="cell.state.bindings"/>
	</div>
</template>
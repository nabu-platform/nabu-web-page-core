<template id="renderer-repeat">
	<div>
		<template v-if="!edit && !loading">
			<div v-for="(record, index) in records">
				<div class="is-repeat-content" 
					:key="'repeat_' + instanceCounter + '_rendered_' + index"
					v-route-render="{ alias: alias, parameters: getParameters(record), mounted: mounted }"></div>
			</div>
		</template>
		<template v-else-if="!edit && loading">
			Loading...
		</template>
		<template v-else>
			<slot></slot>
		</template>
	</div>
</template>

<template id="renderer-repeat-configure">
	<div class="is-column is-spacing-vertical-gap-medium">
		<n-form-combo label="Operation" v-model="target.state.operation" 
			:filter="$services.page.getArrayOperations"
			v-if="!target.state.array"
			:formatter="function(x) { return x.id }"
			:extracter="function(x) { return x.id }"/>
		<n-form-combo label="Array" v-model="target.state.array"
			:filter="function(value) { return $services.page.getAllArrays(page) }"
			v-if="!target.state.operation"/>
			
		<n-page-mapper v-if="target.state.operation && operationParameters.length > 0 && Object.keys($services.page.getPageParameters(page)).length" 
			:to="operationParameters"
			:from="{page:$services.page.getPageParameters(page)}" 
			v-model="target.state.bindings"/>
	</div>
</template>
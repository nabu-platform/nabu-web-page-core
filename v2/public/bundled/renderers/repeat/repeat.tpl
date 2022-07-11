<template id="renderer-repeat">
	<component :is="getComponent()">
		<template v-if="!edit && !loading && state.records.length">
			<n-page :page="fragmentPage"
				v-for="(record, index) in state.records" :record-index="index" class="is-repeat-content" 
				:draggable="target.repeat.enableDrag"
				@dragstart="onDragStart($event, record)"
				:class="getChildComponentClasses('repeat-content')"
				:key="'repeat_' + instanceCounter + '_rendered_' + index"
				:parameters="getParameters(record)"
				:page-instance-id="$services.page.pageCounter++"
				@ready="mounted"/>
		</template>
		<template v-else-if="!edit && !loading && !state.records.length">
			<span class="is-text" v-if="target.repeat.emptyPlaceholder" v-html="$services.page.translate(target.repeat.emptyPlaceholder)"></span>
		</template>
		<template v-else-if="!edit && loading">
			<span class="is-text" v-if="target.repeat.loadingPlaceholder" v-html="$services.page.translate(target.repeat.loadingPlaceholder)"></span>
		</template>
		<template v-else>
			<slot></slot>
		</template>
	</component>
</template>

<template id="renderer-repeat-configure">
	<div class="is-column is-spacing-vertical-gap-medium">
		<n-form-combo label="Operation" v-model="target.repeat.operation" 
			:filter="$services.page.getArrayOperations"
			v-if="!target.repeat.array"
			:formatter="function(x) { return x.id }"
			:extracter="function(x) { return x.id }"/>
		<n-form-combo label="Array" v-model="target.repeat.array"
			:filter="function(value) { return $services.page.getAllArrays(page) }"
			v-if="!target.repeat.operation"/>
			
		<n-form-text v-model="target.repeat.emptyPlaceholder" label="Empty Place Holder"/>
		<n-form-text v-model="target.repeat.loadingPlaceholder" label="Loading Place Holder" v-if="target.repeat.operation"/>
		
		<n-form-switch v-model="target.repeat.enableDrag" label="Enable dragging"/>
		<n-form-text v-model="target.repeat.dragName" label="Drag source name" v-if="target.repeat.enableDrag" placeholder="default"/>
			
		<n-page-mapper v-if="target.repeat.operation && operationParameters.length > 0 && Object.keys($services.page.getPageParameters(page)).length" 
			:to="operationParameters"
			:from="{page:$services.page.getPageParameters(page)}" 
			v-model="target.repeat.bindings"/>
			
	</div>
</template>
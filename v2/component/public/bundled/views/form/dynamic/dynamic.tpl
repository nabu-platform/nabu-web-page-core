<template id="nabu-form-dynamic-component">
	<div class="is-column" :class="getChildComponentClasses('dynamic-field-container')">
		<component v-for="record in records"
			:is="getComponentFor(record)"
			:value="getValueFor(record)"
			@input="function(value, label, field) { update(record, value) }"
			:component-group="cell.state.componentGroup ? cell.state.componentGroup : 'form'"
			:parent-value="getParentValue()"
			:page="page"
			:cell="getParametersFor(record)"
			:field="getParametersFor(record).state"
			:label="getLabelFor(record)"
			:timeout="cell.state.timeout"></component>
	</div>
</template>

<template id="nabu-form-dynamic-component-configure">
	<div class="data-trace-viewer-configure is-column is-spacing-medium">
		<n-form-combo v-model="cell.state.name" label="Field Name" :filter="availableFields"/>
		<data-configure :target="cell.state" :page="page"/>
	</div>
</template>
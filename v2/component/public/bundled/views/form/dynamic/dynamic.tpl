<template id="nabu-form-dynamic-component">
	<div class="is-column">
		<component v-for="record in records"
			:is="getComponentFor(record)"
			:value="getValueFor(record)",
			@input="update.bind($self, record)"
			:component-group="cell.state.componentGroup ? cell.state.componentGroup : 'form'"
			:parent-value="getParentValue()"
			:label="getLabelFor(record)"
			:timeout="cell.state.timeout"/>
	</div>
</template>

<template id="nabu-form-dynamic-component-configure">
	<div class="data-trace-viewer-configure is-column is-spacing-medium">
		<n-form-combo v-model="cell.state.name" label="Field Name" :filter="availableFields"/>
		<data-configure :target="cell.state" :page="page"/>
	</div>
</template>
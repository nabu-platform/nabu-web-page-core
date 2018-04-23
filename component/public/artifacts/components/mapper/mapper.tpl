<template id="n-page-mapper">
	<n-form-section>
		<n-form-combo v-for="field in to" :label="'Map to ' + field" :labels="sources" :filter="fieldsFrom" 
			:value="getValueFor(field)"
			:initial-label="getLabelFor(field)"
			@input="function(newValue, label) { value[field] = label && newValue ? label + '.' + newValue : null }"/>
	</n-form-section>
</template>
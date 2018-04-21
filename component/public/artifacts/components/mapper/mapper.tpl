<template id="n-page-mapper">
	<n-form-section>
		<n-form-combo v-for="field in to" :label="'Map to ' + field" :labels="sources" :filter="fieldsFrom" v-model="value[field]"/>
	</n-form-section>
</template>
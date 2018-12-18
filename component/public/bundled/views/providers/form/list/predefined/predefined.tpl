<template id="page-form-list-input-predefined">
	<div class="page-form-list-input-predefined">
		<n-form-section ref='form'>
			<n-form-section v-for="field in fields">
				<n-form-date :label="field.label" v-model="value[field.name]" v-if="field.type == 'date'" v-bind="field.additional"/>
				<n-form-checkbox :label="field.label" v-model="value[field.name]" v-if="field.type == 'boolean'" v-bind="field.additional"/>
				<n-form-text :label="field.label" v-model="value[field.name]" v-else v-bind="field.additional"/>
			</n-form-section>
		</n-form-section>
	</div>	
</template>

<template id="page-form-list-input-predefined-configure">
	<n-form-section>
		<n-form-combo :filter="listOperations" label="Field Provider Operation" v-model="field.fieldProviderOperation"/>
		<n-form-combo v-model="field.nameField" label="Name Field" :required="true" v-if="field.fieldProviderOperation"
			:items="availableFields"/>
		<n-form-combo v-model="field.labelField" label="Label Field" v-if="field.fieldProviderOperation"
			:items="availableFields"/>
		<n-form-combo v-model="field.typeField" label="Type Field" v-if="field.fieldProviderOperation"
			:items="availableFields"/>
		<n-form-combo v-model="field.valueField" label="Value Field" v-if="field.fieldProviderOperation"
			:items="availableFields"/>
	</n-form-section>
</template>
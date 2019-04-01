<template id="n-page-mapper">
	<n-form-section>
		<n-form-section v-for="field in fieldsToMap">
			<n-form-combo  :label="'Map to ' + field" :labels="sources" :filter="fieldsFrom" 
				:value="getValueFor(field)"
				:initial-label="getLabelFor(field)"
				@input="function(newValue, label) { setValue(field, newValue, label) }"/>
			<n-collapsible :title="'Mapping for: ' + getValueFor(field)" v-if="getLabelFor(field) == '$transformer'">
				<n-page-mapper 
					:to="getTransformerInput(getValueFor(field))" 
					:from="from"
					v-model="getBindingsFor(field)"/>
				<n-form-combo label="Output field"
					:filter="getTransformerOutput.bind($self, getValueFor(field))"
					v-model="getObjectFor(field).output"/>
			</n-collapsible>
		</n-form-section>
	</n-form-section>
</template>
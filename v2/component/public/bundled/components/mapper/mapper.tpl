<template id="n-page-mapper">
	<div class="is-column is-spacing-vertical-gap-medium">
		<div v-for="field in fieldsToMap">
			<n-form-combo :label="'Map to ' + field" :labels="sources" :filter="fieldsFrom" 
				class="vertical"
				:value="getValueFor(field)"
				:initial-label="getLabelFor(field)"
				@input="function(newValue, formatted, rawValue, selectedLabel) { setValue(field, newValue, selectedLabel) }"/>
			
			<n-form-switch v-model="value[field].lambda" label="As lambda" 
				v-if="isLambdable(field)"/>

			<n-collapsible :title="'Mapping for: ' + getValueFor(field)" v-if="getLabelFor(field) == '$function'">
				<n-page-mapper 
					v-if="true || !value[field].lambda"
					:to="$services.page.getFunctionInput(getValueFor(field))" 
					:from="from"
					v-model="getBindingsFor(field)"/>
				<n-form-combo label="Output field"
					:filter="$services.page.getFunctionOutput.bind($self, getValueFor(field))"
					v-model="getObjectFor(field).output"/>
			</n-collapsible>
		</div>
	</div>
</template>


<template id="n-page-mapper2">
	<div class="is-column">
		
		<div class="is-row is-align-end">
			<button class="is-button is-size-xsmall is-variant-primary-outline" :disabled="!unmappedFields.length" @click="adding = true"><icon name="plus"/><span class="is-text">Mapping</span></button>
		</div>
		
		<div class="is-column is-spacing-medium is-color-body" v-if="adding">
			<n-form-combo 
				v-model="fieldToAdd"
				placeholder="Field to add"
				:filter="getUnmappedField"/>
				
			<div v-if="false">
				<n-form-radio
					v-model="fieldMode"
					:extracter="function(x) { return x.name }"
					:formatter="function(x) { return x.title }"
					:items="[{name: 'fixed', title: 'Set a fixed value'},{name: 'map', title: 'Map an existing value'}]"/>
					
				<div class="is-row is-align-space-between">
					<button class="is-button is-size-small is-variant-link" @click="resetField">Cancel</button>
					<button class="is-button is-size-small is-variant-primary" @click="addField">Add mapping</button>
				</div>
			</div>
			<div v-else>
				<div class="is-row is-align-space-between">
					<button class="is-button is-size-small is-variant-link" @click="resetField">Cancel</button>
					<div>
						<button class="is-button is-size-small is-variant-secondary" @click="function() { fieldMode = 'fixed'; addField() }">Add Fixed</button>
						<button class="is-button is-size-small is-variant-primary" @click="function() { fieldMode = 'map'; addField() }">Add Mapping</button>
					</div>
				</div>
			</div>
		</div>
		
		<div v-for="field in mappedFields" class="has-button-close is-column is-spacing-vertical-top-medium">
			
			<n-form-text 
				:label="'Map to ' + field" 
				v-if="isFixedValue(field)"
				:value="getValueFor(field)"
				@input="function(newValue, formatted, rawValue, selectedLabel) { setValue(field, newValue, 'fixed') }"/>
			
			<n-form-combo 
				v-else
				:key="'combo_mapper_' + field"
				:label="'Map to ' + field" 
				:labels="sources" 
				:filter="fieldsFrom" 
				class="vertical"
				:value="getValueFor(field)"
				:initial-label="getLabelFor(field)"
				@input="function(newValue, formatted, rawValue, selectedLabel) { setValue(field, newValue, selectedLabel) }"/>
			
			<button class="is-button is-size-small is-variant-close" @click="removeField(field)"><icon name="times"/></button>
			
			<n-form-switch v-model="value[field].lambda" label="As lambda" 
				v-if="isLambdable(field)"/>

			<n-collapsible :title="'Mapping for: ' + getValueFor(field)" v-if="getLabelFor(field) == '$function'">
				<n-page-mapper 
					v-if="true || !value[field].lambda"
					:to="$services.page.getFunctionInput(getValueFor(field))" 
					:from="from"
					v-model="getBindingsFor(field)"/>
				<n-form-combo label="Output field"
					:filter="$services.page.getFunctionOutput.bind($self, getValueFor(field))"
					v-model="getObjectFor(field).output"/>
			</n-collapsible>
		</div>
	</div>
</template>
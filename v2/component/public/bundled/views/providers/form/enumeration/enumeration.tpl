<template id="enumeration-provider-configure">
	<div class="enumeration-provider-configure is-column">
		<h2 class="section-title">Data Source</h2>
		<div class="is-column is-spacing-medium">
			<n-form-combo v-model="field.provider" :items="['operation', 'array', 'provided', 'fixed']" label="Data source" />
		</div>
		<template v-if="field.provider == 'operation'">
			<h2 class="section-title">Operation</h2>
			<div class="is-column is-spacing-medium">
				<n-form-combo v-model='field.enumerationOperation'
					label='Enumeration Operation'
					:filter='getEnumerationServices'/>
			
				<n-page-mapper v-if='field.enumerationOperation && hasMappableEnumerationParameters(field)'
					v-model='field.enumerationOperationBinding'
					:from='availableParameters'
					:to='getMappableEnumerationParameters(field)'/>
					
				<n-form-combo v-if='field.enumerationOperation' 
					:filter='function() { return getEnumerationFields(field.enumerationOperation) }' 
					v-model='field.enumerationCachingKey' 
					label='Enumeration Caching Key'/>
			</div>
		</template>
		<template v-if="field.provider == 'operation'">
			<h2 class="section-title">Fields</h2>	
			<div class="is-column is-spacing-medium">
				<n-form-switch v-model='field.enumerationFieldLabelComplex' label='Complex Enumeration Label'/>
				
				<n-form-combo 
					v-if='field.enumerationOperation && !field.enumerationFieldLabelComplex' 
					label='Enumeration Label'
					v-model='field.enumerationFieldLabel' 
					:filter='function() { return getEnumerationFields(field.enumerationOperation) }'/>
				
				<n-form-combo 
					v-if='field.enumerationOperation' 
					label='Enumeration Value'
					v-model='field.enumerationFieldValue' 
					:filter='function() { return getEnumerationFields(field.enumerationOperation) }' 
					info='If nothing is selected, the entire document becomes the value'/>
					
				<n-form-combo 
					v-if='field.enumerationOperation' 
					label='Enumeration Query'
					v-model='field.enumerationOperationQuery' 
					:filter='function() { return getEnumerationParameters(field.enumerationOperation) }'/>
					
				<n-form-combo 
					v-if='field.enumerationOperation && field.enumerationFieldValue' 
					label='Resolve Field'
					v-model='field.enumerationOperationResolve' 
					:filter='function() { return getEnumerationParameters(field.enumerationOperation) }' />
					
				<n-form-text v-model='field.complexLabel' label='The complex text label' v-if='field.enumerationOperation && field.enumerationFieldLabelComplex'/>
				<typography-variable-replacer v-if='field.enumerationOperation && field.enumerationFieldLabelComplex && field.complexLabel' :content='field.complexLabel' :page='page' :container='field' :keys='getEnumerationFields(field.enumerationOperation)' />
			</div>
		</template>
		<template v-if="field.provider == 'operation'">	
			<h2 class="section-title">Copywriting</h2>	
			<div class="is-column is-spacing-medium">
				<n-form-text v-model='field.emptyValue' label='Empty Value Text'/>
				<n-form-text v-model='field.calculatingValue' label='Calculating Value Text' info='The text to show while the result is being calculated'/>
				<n-form-text v-model='field.resetValue' label='Reset Value Text' info='The text to show to reset the current value'/>
				<n-form-text v-model='field.selectAllValue' label='Select all value' info='The text to show to select all values or deselect all'/>
			</div>
		</template>
		<div class="is-column is-spacing-medium" v-if="field.provider == 'fixed'">	
			<n-form-switch v-model='field.complex' label='Complex Values' v-if='!field.allowCustom'/>
			<n-form-switch v-if='!field.complex' v-model='field.allowCustom' label='Allow Custom Values'/>
			<div class='is-row is-align-end'>
				<button class='is-button is-size-xsmall is-variant-primary-outline' @click='addEnumeration'><icon name='plus'/><span class='text'>Enumeration</span></button>
			</div>
			<div v-if='!field.complex' class='is-column is-spacing-gap-small'>
				<n-form-section class='has-button-close' v-for='i in Object.keys(field.enumerations)' :key="field.name + 'enumeration_' + i">
					<n-form-text v-model='field.enumerations[i]'/>
					<button class='is-button is-variant-close is-size-small' @click='field.enumerations.splice(i, 1)'><icon name='times'/></button>
				</n-form-section>
			</div>
			<div v-else class='is-column is-spacing-gap-small'>
				<n-form-section class='is-column is-spacing-medium is-spacing-vertical-top-large is-color-body has-button-close' v-for='i in Object.keys(field.enumerations)' :key="field.name + 'enumeration_' + i">
					<n-form-text v-model='field.enumerations[i].key' placeholder='Value' :timeout='600'/>
					<n-form-text v-model='field.enumerations[i].value' placeholder='Label' :timeout='600'/>
					<button class='is-button is-variant-close is-size-small' @click='field.enumerations.splice(i, 1)'><icon name='times'/></button>
				</n-form-section>
			</div>
		</div>
	</div>
</template>


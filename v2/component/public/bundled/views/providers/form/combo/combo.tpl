<template id="page-form-combo-configure">
	<div class="page-form-combo-configure">
		<div class="is-column is-spacing-medium">
			<n-form-switch v-model='field.useCheckbox' label='Add checkboxes'/>
			<n-form-switch v-model='field.showTags' label='Show tags'/>
			<n-form-text v-model='field.maxAmountOfTags' label='Max amount of tags visible' placeholder='3' after='Set to 0 to show all tags'/>
			<n-form-switch v-model='field.showAmount' label='Show amount'/>
			<n-form-switch :invert='true' v-model='field.allowTyping' label='Disable typing' after='Can the user type to search?'/>
			<n-form-switch v-model='field.readOnly' label='Read only' after='Read only mode means the form element is replaced with a readable version'/>
			<n-form-switch v-model='field.selectFirstIfEmpty' label='Select the first value if none has been selected yet'/>
		</div>
		<n-collapsible title="Enumeration data" content-class="is-column is-spacing-medium">
			<enumeration-provider-configure :field="field" :page="page" :cell="cell"/>		
		</n-collapsible>
	</div>
</template>

<template id="page-form-combo">
	<n-form-combo combo-type="n-input-combo2"
		:filter="enumerationFilter"
		:formatter="enumerationFormatter"
		:pretty-formatter="enumerationPrettyFormatter"
		:extracter="enumerationExtracter"
		:edit='!readOnly'
		:placeholder='placeholder'
		@input="function(newValue, label, rawValue, selectedLabel) { $emit('input', newValue, label, rawValue, selectedLabel) }"
		v-bubble:label
		:timeout='600'
		v-bubble:blur
		:label='label'
		:value='value'
		:required='required'
		:allow-typing='field.allowTyping'
		:empty-value='field.emptyValue ? $services.page.translate($services.page.interpret(field.emptyValue)) : null'
		:calculating-value='field.calculatingValue ? $services.page.translate($services.page.interpret(field.calculatingValue)) : null'
		:reset-value='field.resetValue ? $services.page.translate($services.page.interpret(field.resetValue)) : null'
		:info='field.info ? $services.page.translate(field.info) : null'
		:before='field.before ? $services.page.translate(field.before) : null'
		:after='field.after ? $services.page.translate(field.after) : null'
		:suffix='field.suffixIcon ? $services.page.getIconHtml(field.suffixIcon) : field.suffix'
		:schema='schema'
		:disabled='disabled'
		:select-all-value='field.selectAllValue ? $services.page.translate($services.page.interpret(field.selectAllValue)) : null'
		:use-checkbox='field.useCheckbox'
		:show-tags='field.showTags'
		:show-amount='field.showAmount'
		:max-amount-of-tags='field.maxAmountOfTags'
		/>
</template>
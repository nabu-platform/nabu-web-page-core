<template id="enumeration-configure">
	<n-form-section>
		<n-form-switch v-model='field.showRadioView' label='Show radio visualisation'/>
		<n-form-switch v-model='field.complex' label='Complex Values' v-if='!field.allowCustom'/>
		<n-form-switch v-model='field.icon' v-if='field.showRadioView' label='Icon (instead of radio)'/>
		<n-form-switch v-model='field.iconAlt' v-if='field.showRadioView && field.icon' label='Icon (when not selected)'/>
		<n-form-switch v-if='!field.showRadioView' v-model='field.forceValue' label='Force Any Value' />
		<n-form-switch v-if='!field.complex' v-model='field.allowCustom' label='Allow Custom Values'/>
		<n-form-combo v-model='field.required' label='Required' :items="[true,false]" />
		<n-form-combo v-if='field.showRadioView' v-model='field.mustChoose' label='Must choose' :items="[true,false]" />
		<n-form-text v-model='field.info' label='Info Content'/>
		<n-form-text v-model='field.before' label='Before Content'/>
		<n-form-text v-model='field.beforeIcon' label='Before Icon' v-if='field.before'/>
		<n-form-text v-model='field.after' label='After Content'/>
		<n-form-text v-model='field.afterIcon' label='After Icon' v-if='field.after'/>
		<n-form-text v-model='field.suffix' label='Suffix' v-if='!field.suffixIcon'/>
		<n-form-text v-model='field.suffixIcon' label='Suffix Icon' v-if='!field.suffix'/>
		<div class="is-row is-align-end">
			<button class="is-button is-primary-outline is-size-small" @click='addFixedEnumeration'><icon name="plus"/><span class="is-text">Enumeration</span></button>
		</div>
		<div v-if='!field.complex'>
			<n-form-section class='enumeration list-row' v-for='i in Object.keys(field.enumerations)' :key="field.name + 'enumeration_' + i">
				<n-form-text v-model='field.enumerations[i]'/>
				<button @click='field.enumerations.splice(i, 1)'><span class='fa fa-trash'></span></button>
			</n-form-section>
		</div>
		<div v-else>
			<n-form-section class='enumeration list-row' v-for='i in Object.keys(field.enumerations)' :key="field.name + 'enumeration_' + i">
				<n-form-text v-model='field.enumerations[i].key' placeholder='Value' :timeout='600'/>
				<n-form-text v-model='field.enumerations[i].value' placeholder='Label' :timeout='600'/>
				<button @click='field.enumerations.splice(i, 1)'><span class='fa fa-trash'></span></button>
			</n-form-section>
		</div>
	</n-form-section>
</template>


<template id="combo">
	<n-form-combo 
		:filter='enumerate' 
		ref='form'
		:edit='!readOnly'
		:nillable='!field.forceValue'
		:placeholder='placeholder'
		@input="function(newValue) { $emit('input', newValue) }"
		:formatter='formatter'
		:label='label'
		:value='value'
		v-bubble:label
		v-bubble:blur
		:description='field.description ? $services.page.translate(field.description) : null'
		:description-type='field.descriptionType'
		:description-icon='field.descriptionIcon'
		:info='field.info ? $services.page.translate(field.info) : null'
		:before='field.before ? $services.page.translate(field.before) : null'
		:after='field.after ? $services.page.translate(field.after) : null'
		:suffix='field.suffixIcon ? $services.page.getIconHtml(field.suffixIcon) : field.suffix'
		:schema='schema'
		:required='field.required'
		:extracter='extracter'		
		:disabled='disabled'/>
			
</template>

<template id="radio">
	<n-form-radio 
		:items='field.enumerations' 
		ref='form'
		:edit='!readOnly'
		:placeholder='placeholder'
		@input="function(newValue) { $emit('input', newValue) }"
		:formatter='formatter'
		:label='label'
		:value='value'
		:icon='field.icon'
		:icon-alt='field.iconAlt'
		:description='field.description ? $services.page.translate(field.description) : null'
		:description-type='field.descriptionType'
		:description-icon='field.descriptionIcon'
		:info='field.info ? $services.page.translate(field.info) : null'
		:before='field.before ? $services.page.translate(field.before) : null'
		:after='field.after ? $services.page.translate(field.after) : null'
		:suffix='field.suffixIcon ? $services.page.getIconHtml(field.suffixIcon) : field.suffix'
		:schema='schema'
		v-bubble:label
		:required='field.required'
		:must-choose='field.mustChoose ? $services.page.interpret(field.mustChoose, $self) : null'
		:extracter='extracter'
		:disabled='disabled'/>
</template>
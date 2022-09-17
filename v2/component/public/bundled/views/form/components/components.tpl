<template id="nabu-form-component">
	<component :is="formComponent" :page="page" :cell="cell"
		:codes="cell.state.codes"
		ref="input"
		:field="cell.state"
		:class="getChildComponentClasses('form-component')"
		@blur="blur"
		:component-group="cell.state.componentGroup ? cell.state.componentGroup : 'default'"
		:value="value"
		:parent-value="parentValue"
		:label="$services.page.translate(cell.state.label)"
		:timeout="cell.state.timeout"
		:disabled="disabled"
		:schema="getSchema()"
		:readOnly="false"
		:placeholder="$services.page.translate(cell.state.placeholder)"
		:child-components="childComponents"
		@input="update"/>
</template>


<template id="nabu-form-component-configuration">
	<div>
		<div class="is-column is-spacing-medium">
			<n-form-combo v-model="cell.state.name" label="Field Name" :filter="availableFields"/>
			<n-form-text v-model="cell.state.label" label="Label"/>
			<n-form-text v-model="cell.state.placeholder" label="Placeholder"/>
			<n-form-text v-model="cell.state.timeout" label="Timeout"/>
			<n-form-text v-model="cell.state.componentGroup" label="Component Group"/>
			<n-form-text v-model="cell.state.disabled" label="Disable if" />
			<n-form-switch v-model="cell.state.validateOnBlur" label="Validate on blur"/>
		</div>
		<component :is="configurationComponent" :page="page" :cell="cell" :field="cell.state" :possible-fields="availableFields()"
			class="is-column is-spacing-medium"/>
			
		<div class="is-column is-spacing-medium">
			<h3 class="is-h3">Validation Messages</h3>
			<p class="is-p is-size-small">You can remap specific validation codes to provide the user with a different message than the default message available for that code.</p>
			<div v-if='cell.state.codes' class="is-column is-spacing-vertical-gap-medium">
				<div class="is-column is-color-body is-spacing-medium has-button-close" v-for='code in cell.state.codes' :timeout='600'>
					<n-form-text v-model='code.code' label='Code' :timeout='600' after="The code you want to remap, for example 'required'"/>
					<n-form-text v-model='code.title' label='Title' :timeout='600' after="The message you want to show the user"/>
					<button class="is-button is-variant-close" @click='cell.state.codes.splice(cell.state.codes.indexOf(code), 1)'><icon name="times"/></button>
				</div>
			</div>
			<div class="is-row is-align-end">
				<button class="is-button is-size-xsmall is-variant-primary-outline" @click="cell.state.codes ? cell.state.codes.push({code:null,title:null}) : $window.Vue.set(cell.state, 'codes', [{code:null,title:null}])"><icon name="plus"/><span class="is-text">Message</span></button>
			</div>
		</div>
	</div>
</template>
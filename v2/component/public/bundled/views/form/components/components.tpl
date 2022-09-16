<template id="nabu-form-component">
	<component :is="formComponent" :page="page" :cell="cell"
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
	</div>
</template>
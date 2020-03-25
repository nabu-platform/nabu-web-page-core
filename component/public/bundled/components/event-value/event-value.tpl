<template id="page-event-value">
	<component :is="inline ? 'div' : 'n-collapsible'" :title="title" class="page-event-value">
		<div class="padded-content">
			<n-form-text v-model="container[name].name" label="Event Name" :timeout="600" @input="$emit('updatedEvents')"/>
			<div v-for="eventField in container[name].eventFields" class="list-row">
				<n-form-text v-model="eventField.name" label="Field Name" :timeout="600"/>
				<n-form-switch v-model="eventField.isFixed" label="Fixed?"/>
				<n-form-combo v-model="eventField.stateValue" v-if="!eventField.isFixed" label="State Value"
					:filter="function(value) { return $services.page.getSimpleKeysFor({properties:$services.page.getAllAvailableParameters(page, null, true)}).filter(function(x) { return !value || x.toLowerCase().indexOf(value.toLowerCase()) >= 0 }) }"/>
				<n-form-text v-model="eventField.fixedValue" v-else label="Fixed Value" :timeout="600"/>
				<span @click="container[name].eventFields.splice(container[name].eventFields.indexOf(eventField), 1) & $emit('updatedEvents')" class="fa fa-times"></span>
			</div>
		</div>
		<div class="list-actions">
			<button @click="addEventField(container[name]) & $emit('updatedEvents')">Add Field</button>
		</div>
	</component>
</template>

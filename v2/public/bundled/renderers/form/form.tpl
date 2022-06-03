<template id="renderer-form">
	<n-form>
		<slot></slot>
	</n-form>
</template>

<template id="renderer-form-configure">
	<div class="renderer-form-configure">
		<n-form-combo label="Operation" v-model="target.form.operation" 
			:filter="getOperations"
			:formatter="function(x) { return x.id }"
			:extracter="function(x) { return x.id }"/>
		<n-form-combo label="Submit Trigger" v-model="target.form.triggerEvent"
			v-if="target.form.operation"
			:filter="$services.page.getPageInstance($self.page, $self).getAvailableEvents"/>
		
		<n-form-text v-if="target.form.operation" v-model="target.form.submitEvent" label="Submit event" after="Emitted once the form has been submitted, the response at that point may still be positive or negative"/>
		<n-form-text v-if="target.form.operation" v-model="target.form.successEvent" label="Success event" after="Emitted once the form has been successfully submitted"/>
		<n-form-text v-if="target.form.operation" v-model="target.form.errorEvent" label="Error event" after="Emitted if the form could not be submitted correctly"/>
		
		<n-form-switch v-model="target.form.noInlineErrors" label="Disable inline error message" after="By default, validation errors will be shown inline."/>
	</div>
</template>


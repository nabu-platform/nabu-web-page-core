<template id="renderer-form">
	<n-form :class="getChildComponentClasses('form')" :content-class="getChildComponentClasses('form-container')" :mode="mode">
		<slot></slot>
		<n-messages :messages="messages" slot="footer" v-if="messages.length"/>
	</n-form>
</template>

<template id="renderer-form-configure">
	<div class="renderer-form-configure">
		
		<n-form-radio 
			name="form-type"
			v-model="target.form.formType"
			:items="[{name: 'page', title: 'Page form'}, {name:'operation', title: 'Operation Form'}, {name: 'array', title: 'Array form'}]"
			:formatter="function(x) { return x.title }"
			:extracter="function(x) { return x.name }"
			label="What type of form do you want?"/>
		
		
		<div v-if="target.form.formType == 'operation'">
			<n-form-combo label="Operation" v-model="target.form.operation" 
				:filter="getOperations"
				:formatter="function(x) { return x.id }"
				:extracter="function(x) { return x.id }"/>
		</div>
		
		<div v-else-if="target.form.formType == 'page'" class="is-column is-spacing-medium">
			<div class="is-row is-align-end">
				<button class="is-button is-variant-primary-outline is-size-xsmall" @click="target.form.fields.push({})"><icon name="plus"/><span class="is-text">Add state field</span></button>
			</div>
			<div v-for="field in target.form.fields" class="is-column is-color-body is-spacing-medium has-button-close">
				<n-form-text v-model="field.name" label="Field name"/>
				<n-form-combo v-model="field.type" label="Field type" :filter="getParameterTypes"/>
				<button class="is-button is-variant-close is-size-xsmall" @click="target.form.fields.splice(target.form.fields.indexOf(field), 1)"><icon name="times"/></button>
			</div>
		</div>
		
		<div v-else-if="target.form.formType == 'array'" class="is-column is-spacing-medium">
			<n-form-combo 
				label="Array" 
				v-model="target.form.array"
				:filter="function(value) { return $services.page.getAllArrays(page) }"
				/>
		</div>

		<div v-if="false && (target.form.formType == 'operation' || (target.form.formType == 'page' && target.form.submitType == 'staged'))">
			<n-form-text v-model="target.form.submitEvent" label="Submit event" after="Emitted once the form has been submitted, the response at that point may still be positive or negative"/>
			<n-form-text v-model="target.form.successEvent" label="Success event" after="Emitted once the form has been successfully submitted"/>
			<n-form-text v-model="target.form.errorEvent" label="Error event" after="Emitted if the form could not be submitted correctly"/>
		</div>
		
		<div v-if="target.form.formType">
			<n-form-switch v-model="target.form.noInlineErrors" label="Disable inline error message" after="By default, validation errors will be shown inline."/>
		</div>
	</div>
</template>


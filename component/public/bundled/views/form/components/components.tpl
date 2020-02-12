<template id="nabu-form-component">
	<div class="nabu-form-component">
		<n-sidebar class="settings" :inline="true" v-if="configuring" @close="configuring = false">
			<n-collapsible title="Field Settings" class="padded">
				<n-form-combo v-model="cell.state.name" label="Field Name" :filter="availableFields"/>
				<n-form-text v-model="cell.state.label" label="Label"/>
				<n-form-text v-model="cell.state.placeholder" label="Placeholder"/>
				<n-form-text v-model="cell.state.timeout" label="Timeout"/>
				<component :is="configurationComponent" :page="page" :cell="cell" :field="cell.state"/>
			</n-collapsible>
		</n-sidebar>
		<component :is="formComponent" :page="page" :cell="cell"
			:field="cell.state"
			:value="cell.state.name ? getPageInstance().get(cell.state.name) : null"
			:label="$services.page.translate(cell.state.label)"
			:timeout="cell.state.timeout"
			:disabled="false"
			:schema="getSchema()"
			:readOnly="false"
			:placeholder="$services.page.translate(cell.state.placeholder)"
			@input="update"/>
	</div>
</template>
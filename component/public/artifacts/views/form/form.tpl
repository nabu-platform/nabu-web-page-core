<template id="page-form">
	<div class="page-form">
		<n-sidebar @close="configuring = false" v-show="configuring" class="settings">
			<n-form class="layout2">
				<n-collapsible title="Form Settings">
					<n-form-combo label="Operation" :value="operation" :filter="getOperations"
						@input="updateOperation"
						:formatter="function(x) { return x.id }"/>
					<n-form-text v-model="cell.state.title" label="Title"/>
					<n-form-text v-model="cell.state.class" label="Form Class"/>
					<n-form-switch v-model="cell.state.immediate" label="Save On Change"/>
					<n-form-text v-model="cell.state.cancel" v-if="!cell.state.immediate" label="Cancel Label"/>
					<n-form-text v-model="cell.state.ok" v-if="!cell.state.immediate" label="Ok Label"/>
					<n-form-text v-model="cell.state.event" label="Success Event"/>
					<n-form-switch v-model="cell.state.synchronize" label="Synchronize Changes"/>
				</n-collapsible>
				<n-collapsible title="Value Binding">
					<n-page-mapper :to="Object.keys(cell.bindings)" :from="availableParameters" 
						v-model="cell.bindings"/>
				</n-collapsible>
				<page-form-configure title="Fields" :fields="cell.state.fields" :is-list="isList" :possible-fields="fieldsToAdd"/>
			</n-form>
		</n-sidebar>
		<h2 v-if="cell.state.title">{{cell.state.title}}</h2>
		<n-form :class="cell.state.class" ref="form">
			<n-form-section v-for="field in cell.state.fields" :key="field.name + '_section'" v-if="!isPartOfList(field.name)">
				<n-form-section v-if="isList(field.name)">
					<button @click="addInstanceOfField(field)">Add {{field.label ? field.label : field.name}}</button>
					<n-form-section v-if="result[field.name]">
						<n-form-section v-for="i in Object.keys(result[field.name])" :key="field.name + '_wrapper' + i">
							<n-form-section v-for="key in Object.keys(result[field.name][i])" :key="field.name + '_wrapper' + i + '_wrapper'"
									v-if="getField(field.name + '.' + key)">
								<page-form-field :key="field.name + '_value' + i + '_' + key" :field="getField(field.name + '.' + key)" 
									:schema="getSchemaFor(field.name + '.' + key)" v-model="result[field.name][i][key]"
									@input="changed"
									:timeout="cell.state.immediate ? 600 : 0"/>
							</n-form-section>
							<button @click="result[field.name].splice(i, 1)">Remove {{field.label ? field.label : field.name}}</button>	
						</n-form-section>
					</n-form-section>
				</n-form-section>
				<page-form-field v-else :key="field.name + '_value'" :field="field" :schema="getSchemaFor(field.name)" :value="result[field.name]"
					@input="function(newValue) { $window.Vue.set(result, field.name, newValue); changed(); }"
					:timeout="cell.state.immediate ? 600 : 0"/>
			</n-form-section>
			<footer class="global-actions" v-if="!cell.state.immediate">
				<a class="cancel" href="javascript:void(0)" @click="$emit('close')" v-if="cell.state.cancel">{{cell.state.cancel}}</a>
				<button class="primary" @click="doIt" v-if="cell.state.ok">{{cell.state.ok}}</button>
			</footer>
		</n-form>
	</div>
</template>

<template id="page-form-field">
	<n-form-section class="page-form-field">
		<n-form-text v-if="field.type == 'text' || field.type == 'number' || field.type == 'area'" :type="field.type"
			:schema="schema"
			@input="function(newValue) { $emit('input', newValue) }"
			:label="fieldLabel"
			:value="value"
			:timeout="timeout"
			:disabled="isDisabled"/>
		<n-form-date v-if="field.type == 'date'"
			@input="function(newValue) { $emit('input', newValue) }"
			:label="fieldLabel"
			:value="value"
			:timeout="timeout"
			:disabled="isDisabled"/>
		<n-form-combo v-if="field.type == 'enumeration'" :items="field.enumeration"
			@input="function(newValue) { $emit('input', newValue) }"
			:label="fieldLabel"
			:value="value"
			:disabled="isDisabled"/>
		<n-form-combo v-if="field.type == 'enumerationOperation'" :filter="filterEnumeration"
			:formatter="function(x) { return field.enumerationOperationLabel ? x[field.enumerationOperationLabel] : x }"
			v-model="currentEnumerationValue"
			:timeout="timeout"
			:label="fieldLabel"
			:disabled="isDisabled"/>
		<n-form-switch v-if="field.type == 'boolean'" 
			:value="value"
			:label="fieldLabel"
			@input="function(newValue) { $emit('input', newValue) }"
			:disabled="isDisabled"/>
	</n-form-section>
</template>

<template id="page-form-configure">
	<n-collapsible class="list" :title="title">
		<div class="list-actions">
			<button @click="addField" v-if="possibleFields.length">Add</button>
		</div>
		<n-collapsible class="field list-item" v-for="field in fields" :title="field.label ? field.label : field.name">
			<page-form-configure-single :field="field" :possible-fields="possibleFields"
				:is-list="isList"/>
			<div class="list-item-actions">
				<button @click="up(field)"><span class="fa fa-chevron-circle-up"></span></button>
				<button @click="down(field)"><span class="fa fa-chevron-circle-down"></span></button>
				<button @click="fields.splice(fields.indexOf(field), 1)"><span class="fa fa-trash"></span></button>
			</div>
		</n-collapsible>
	</n-collapsible>
</template>

<template id="page-form-configure-single">
	<div class="page-form-single-field">
		<n-form-combo v-model="field.name" label="Field Name" :items="possibleFields"/>
		<n-form-text v-model="field.label" label="Label" v-if="allowLabel" />
		<n-form-text v-model="field.description" label="Description" v-if="allowDescription" />
		<n-form-combo v-model="field.type" v-if="!isList || !isList(field.name)" label="Type" :items="['text', 'area', 'enumeration', 'enumerationOperation', 'date', 'number', 'fixed', 'boolean']"/>
		<button v-if="field.type == 'enumeration'" @click="field.enumerations.push('')">Add enumeration</button>
		<n-form-section class="enumeration" v-if="field.type == 'enumeration'" v-for="i in Object.keys(field.enumerations)" :key="field.name + 'enumeration_' + i">
			<n-form-text v-model="field.enumerations[i]"/>
			<button @click="field.enumerations.splice(i, 1)">Remove Enumeration</button>
		</n-form-section>
		<n-form-text v-model="field.value" v-if="field.type == 'fixed'" label="Fixed Value"/>
		<n-form-section class="enumeration" v-if="field.type == 'enumerationOperation'">
			<n-form-combo :value="field.enumerationOperation ? $services.swagger.operations[field.enumerationOperation] : null"
				label="Enumeration Operation"
				@input="function(newValue) { field.enumerationOperation = newValue.id }"
				:formatter="function(x) { return x.id }"
				:filter="getEnumerationServices"/>
			<n-form-combo v-if="field.enumerationOperation" v-model="field.enumerationOperationLabel" label="Enumeration Label"
				:filter="function() { return getEnumerationFields(field.enumerationOperation) }"/>
			<n-form-combo v-if="field.enumerationOperation" v-model="field.enumerationOperationValue" label="Enumeration Value"
				:filter="function() { return getEnumerationFields(field.enumerationOperation) }"/>
			<n-form-combo v-if="field.enumerationOperation" v-model="field.enumerationOperationQuery" label="Enumeration Query"
				:filter="function() { return getEnumerationParameters(field.enumerationOperation) }"/>
		</n-form-section>
	</div>
</template>
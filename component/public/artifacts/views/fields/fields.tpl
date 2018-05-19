<template id="page-fields-edit">
	<n-collapsible title="Fields" class="page-fields list">
		<div class="list-actions" v-if="allowMultiple">
			<button @click="addField">Add Field</button>
		</div>
		<n-collapsible class="list-item" :title="field.label ? field.label : 'Unlabeled'" v-for="field in cell.state.fields">
			<n-form-text v-model="field.label" label="Field Label"/>
			<div class="list-item-actions">
				<button @click="addFragment(field)">Add Fragment</button>
				<button v-if="allowMultiple" @click="cell.state.fields.splice(cell.state.fields.indexOf(field), 1)">Remove Field</button>
				<button v-if="allowMultiple" @click="fieldUp(field)"><span class="fa fa-chevron-circle-up"></span></button>
				<button v-if="allowMultiple" @click="fieldDown(field)"><span class="fa fa-chevron-circle-down"></span></button>
			</div>
			<div v-for="fragment in field.fragments">
				<n-form-combo v-model="fragment.type" label="Fragment Type" :items="fragmentTypes"/>
				<n-form-text v-model="fragment.hidden" label="Hide fragment if"/>
				<n-form-combo v-if="fragment.type == 'data'" v-model="fragment.key" label="Data Key" :filter="getKeys"/>
				<n-form-text v-model="fragment.class" label="Fragment Class"/>
				
				<component v-if="fragment.type" :cell="cell" :page="page" :keys="getKeys()"
					:fragment="fragment"
					:is="getProvidedConfiguration(fragment.type)"/>
					
				<div class="list-item-actions" v-if="allowMultiple">
					<button @click="up(field, fragment)"><span class="fa fa-chevron-circle-up"></span></button>
					<button @click="down(field, fragment)"><span class="fa fa-chevron-circle-down"></span></button>
					<button @click="field.fragments.splice(field.fragments.indexOf(fragment), 1)"><span class="fa fa-trash"></span></button>
				</div>
			</div>
			<div class="list-item-actions">
				<button @click="addStyle(field)">Add Style</button>
			</div>
			<n-form-section class="list-row" v-for="style in field.styles">
				<n-form-text v-model="style.class" label="Class"/>
				<n-form-text v-model="style.condition" label="Condition"/>
				<button @click="field.styles.splice(field.styles.indexOf(style), 1)"><span class="fa fa-trash"></span></button>
			</n-form-section>
		</n-collapsible>
	</n-collapsible>
</template>

<template id="page-formatted-configure">
	<div class="page-formatted-configure">
		<n-form-combo v-model="fragment.format" label="Format as" :items="types"/>
		<n-ace v-if="fragment.format == 'javascript'" mode="javascript" v-model="fragment.javascript"/>
		<n-ace v-if="fragment.format == 'html'" mode="html" v-model="fragment.html"/>
		<n-form-text v-if="fragment.format == 'number'" v-model="fragment.amountOfDecimals" label="Amount of decimals"/>
		<n-form-combo label="Date Format" v-if="fragment.format == 'date'" v-model="fragment.dateFormat" :filter="function(value) { return [value, 'date', 'dateTime'] }"/>
		<n-form-combo label="Type" v-model="fragment.tag" :items="['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div']"/>
		<component v-if="isProvided(fragment.format) && getConfiguration(fragment.format)"
			:is="getConfiguration(fragment.format)"
			:page="page" 
			:cell="cell"
			:fragment="fragment"/>
	</div>
</template>

<template id="page-field">
	<div class="page-field" :class="getDynamicClasses(field)">
		<dt v-if="label && field.label">{{field.label}}</dt>
		<dd class="page-field-fragment" :class="fragment.class" v-for="fragment in field.fragments" v-if="!isHidden(fragment)">
			<component v-if="fragment.type" 
				:is="getProvidedComponent(fragment.type)"
				:page="page" 
				:cell="cell"
				:data="data"
				:fragment="fragment"
				@updated="function(value) { $emit('updated', value) }"/>
		</dd>
	</div>
</template>

<template id="page-fields">
	<dl class="page-fields" :class="cell.state.class">
		<n-sidebar @close="configuring = false" v-if="configuring" class="settings">
			<n-form class="layout2">
				<n-collapsible title="Field Settings">
					<n-form-text v-model="cell.state.class" label="Class"/>
				</n-collapsible>
				<page-fields-edit :cell="cell" :allow-multiple="true" :page="page" :data="data" :style="style"/>
			</n-form>
		</n-sidebar>
		<page-field v-for="field in cell.state.fields" :field="field" :data="data ? data : state" :label="label"
			:page="page"
			:cell="cell"
			@updated="function(value) { $emit('updated', value) }"/>
	</dl>
</template>
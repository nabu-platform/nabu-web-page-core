<template id="nabu-page-fields-edit">
	<n-collapsible title="Filters" class="nabu-page-fields" class="list">
		<div class="list-actions" v-if="allowMultiple">
			<button @click="addField">Add Field</button>
		</div>
		<n-collapsible class="list-item" :title="field.label ? field.label : 'Unlabeled'" v-for="field in cell.state.fields">
			<n-form-text v-model="field.label" label="Field Label"/>
			<n-form-text v-model="field.class" label="Field Class"/>
			<div class="list-item-actions">
				<button @click="addFragment(field)">Add Fragment</button>
			</div>
			<div v-for="fragment in field.fragments">
				<n-form-text v-model="fragment.class" label="Fragment Class"/>
				<n-form-combo v-model="fragment.type" label="Fragment Type" :items="['data', 'text', 'area', 'richtext'"/>
				<n-form-richtext v-if="fragment.type == 'richtext'" v-model="fragment.content"/>
				<n-form-text v-else-if="fragment.type == 'text' || fragment.type == 'area'" :type="fragment.type" v-model="fragment.content"/>
				<n-form-combo v-if="fragment.type == 'data'" v-model="fragment.key" :label="Data Key" :filter="getKeys"/>
				<n-form-combo v-if="fragment.type == 'data'" v-model="fragment.format" :label="'Format ' + key + ' as'"
					:items="['link', 'date', 'dateTime', 'time', 'masterdata', 'template', 'javascript']"/>
				<n-ace v-if="fragment.format == 'javascript'" mode="javascript" v-model="fragment.javascript"/>
				<n-ace v-if="fragment.format == 'template'" mode="html" v-model="fragment.template"/>
			</div>
		</n-collapsible>
	</n-collapsible>
</template>

<template id="nabu-page-field">
	<div class="nabu-field" :class="field.class">
		<div class="nabu-field-fragment" :class="fragment.class" v-for="fragment in field.fragments">
			<div v-if="fragment.type == 'data'">{{ format(fragment) }}</div>
			<div v-else-if="fragment.type == 'richtext'" v-content.compile.sanitize="fragment.content"></div>
			<div v-else-if="fragment.type == 'text' || fragment.type == 'area'" v-content.compile.plain="fragment.content"></div>
		</div>
	</div>
</template>

<template id="nabu-page-fields">
	<div class="nabu-fields">
		<nabu-page-field v-for="field in fields" :field="field" :data="data"/>
	</div>
</template>
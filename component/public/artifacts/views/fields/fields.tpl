<template id="nabu-page-fields-edit">
	<n-collapsible title="Fields" class="nabu-page-fields list">
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
				<n-form-combo v-model="fragment.type" label="Fragment Type" :items="['data', 'text', 'area', 'richtext']"/>
				<n-form-richtext v-if="fragment.type == 'richtext'" v-model="fragment.content"/>
				<n-form-text label="Text" v-else-if="fragment.type == 'text' || fragment.type == 'area'" :type="fragment.type" v-model="fragment.content"/>
				<n-form-combo v-if="fragment.type == 'data'" v-model="fragment.key" label="Data Key" :filter="getKeys"/>
				<n-form-combo v-if="fragment.type == 'data'" v-model="fragment.format" :label="'Format ' + fragment.key + ' as'"
					:items="['link', 'date', 'dateTime', 'time', 'masterdata', 'template', 'javascript']"/>
				<n-form-text v-model="fragment.class" label="Fragment Class"/>
				<n-ace v-if="fragment.format == 'javascript'" mode="javascript" v-model="fragment.javascript"/>
				<n-ace v-if="fragment.format == 'template'" mode="html" v-model="fragment.template"/>
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

<template id="nabu-page-field">
	<div class="nabu-field" :class="getDynamicClasses(field)">
		<label v-if="label && field.label">{{field.label}}</label>
		<div class="nabu-field-fragment" :class="fragment.class" v-for="fragment in field.fragments">
			<span v-if="fragment.type == 'data'">{{ format(fragment) }}</span>
			<div v-else-if="fragment.type == 'richtext'" v-content.compile.sanitize="fragment.content"></div>
			<div v-else-if="fragment.type == 'area'" v-content.compile.plain="fragment.content"></div>
			<span v-else-if="fragment.type == 'text'" v-content.compile.plain="fragment.content"></span>
		</div>
	</div>
</template>

<template id="nabu-page-fields">
	<div class="nabu-fields">
		<n-sidebar @close="configuring = false" v-if="configuring" class="settings">
			<n-form class="layout2">
				<nabu-page-fields-edit :cell="cell" :allow-multiple="true" :page="page" :data="data" :style="style"/>
			</n-form>
		</n-sidebar>
		<nabu-page-field v-for="field in cell.state.fields" :field="field" :data="data ? data : state" :label="label"/>
	</div>
</template>
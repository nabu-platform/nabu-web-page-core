<template id="page-form">
	<div class="page-form">
		<n-sidebar @close="configuring = false" v-if="configuring" class="settings">
			<n-form class="layout2">
				<n-collapsible title="Form Settings">
					<n-form-combo label="Operation" :value="operation" :filter="getOperations"
						@input="updateOperation"
						:formatter="function(x) { return x.id }"
						v-if="!cell.state.pageForm && !cell.state.functionForm"/>
					<n-form-switch label="Page form" v-model="cell.state.pageForm"
						v-if="!cell.state.operation && !cell.state.functionForm"/>
					<n-form-switch label="Function form" v-model="cell.state.functionForm"
						v-if="!cell.state.operation && !cell.state.pageForm"/>
					<n-form-combo label="Function" v-model="cell.state.functionId" v-if="cell.state.functionForm" 
						:filter="$services.page.listFunctions"/>
					<n-form-text v-model="cell.state.title" label="Title"/>
					<n-form-text v-model="cell.state.formId" label="Form Id"/>
					<n-form-text v-model="cell.state.analysisId" label="Analysis Id"/>
					<n-form-text v-model="cell.state.class" label="Form Class"/>
					<n-form-switch v-model="cell.state.immediate" label="Save On Change"/>
					<n-form-text v-model="cell.state.cancel" v-if="!cell.state.immediate" label="Cancel Label"/>
					<n-form-text v-model="cell.state.ok" v-if="!cell.state.immediate" label="Ok Label"/>
					<n-form-text v-model="cell.state.next" v-if="!cell.state.immediate && cell.state.pages.length > 1" label="Next Label"/>
					<n-form-text v-model="cell.state.previous" v-if="!cell.state.immediate && cell.state.pages.length > 1" label="Previous Label"/>
					<n-form-text v-model="cell.state.event" label="Success Event" :timeout="600" @input="$emit('updatedEvents')"/>
					<n-form-text v-model="cell.state.cancelEvent" label="Cancel Event" :timeout="600" @input="$emit('updatedEvents')"/>
					<n-form-text v-if="cell.state.event" v-model="cell.state.submitEvent" label="Submit Event" :timeout="600" @input="$emit('updatedEvents')"/>
					<n-form-text v-if="cell.state.operation || cell.state.functionForm" v-model="cell.state.errorEvent" label="Error Event" :timeout="600" @input="$emit('updatedEvents')"/>
					<n-form-text v-model="cell.state.errorEventCodes" label="Error Event Codes" v-if="cell.state.errorEvent"/>
					<n-form-switch v-model="cell.state.synchronize" label="Synchronize Changes"/>
					<n-form-switch v-model="cell.state.autofocus" label="Autofocus"/>
					<n-form-switch v-model="cell.state.autoclose" label="Autoclose"/>
					<n-form-switch v-if="cell.state.pages.length >= 2" v-model="cell.state.pageTabs" label="Pages as tabs"/>
					<n-form-switch v-if="cell.state.pages.length >= 2" v-model="cell.state.partialSubmit" label="Allow partial submit"/>
					<n-form-switch v-model="cell.state.allowReadOnly" label="Allow read only mode"/>
					<n-form-switch v-if="cell.state.allowReadOnly" v-model="cell.state.startAsReadOnly" label="Start in read only mode"/>
					<n-form-switch v-if="cell.state.allowReadOnly" v-model="cell.state.onlyOneEdit" label="Allow only one in edit mode"/>
					<n-form-text v-if="cell.state.allowReadOnly" v-model="cell.state.edit" label="Edit Label"/>
					<n-form-text v-if="cell.state.allowReadOnly" v-model="cell.state.editIcon" label="Edit Icon"/>
					<n-form-text v-model="cell.state.mode" label="Message Mode (the literal 'component' or a number)"/>
				</n-collapsible>
				<n-collapsible title="Value Binding" v-if="!cell.state.pageForm">
					<div class="list-row">
						<n-form-combo :items="Object.keys(availableParameters)" v-model="autoMapFrom"/>
						<button @click="automap" :disabled="!autoMapFrom">Automap</button>
					</div>
					<n-page-mapper :to="fieldsToAdd" :from="availableParameters" 
						v-model="cell.bindings"/>
				</n-collapsible>
				<div v-for="cellPage in cell.state.pages">
					<page-form-configure :title="cellPage.name"
						:allow-read-only="cell.state.allowReadOnly"
						:schema-resolver="getSchemaFor"
						:groupable="true"
						:edit-name="true"
						:fields="cellPage.fields" 
						:is-list="isList"
						:possible-fields="fieldsToAdd"
						:page="page"
						@input="function(newValue) { cellPage.name = newValue }"
						:cell="cell"/>
					<div class="list-actions">
						<span>Page Actions: </span>
						<button v-if="cell.state.pages.length > 1" @click="upAllPage(cellPage)"><span class="fa fa-chevron-circle-left"></span></button>
						<button v-if="cell.state.pages.length > 1" @click="upPage(cellPage)"><span class="fa fa-chevron-circle-up"></span></button>
						<button v-if="cell.state.pages.length > 1" @click="downPage(cellPage)"><span class="fa fa-chevron-circle-down"></span></button>
						<button v-if="cell.state.pages.length > 1" @click="downAllPage(cellPage)"><span class="fa fa-chevron-circle-right"></span></button>
						<button @click="copyPage(cellPage)"><span class="fa fa-copy"></span></button>
						<button v-if="cell.state.pages.length > 1" @click="deletePage(cellPage)">Delete {{cellPage.name}}</button>
					</div>
				</div>
				<div class="list-actions">
					<button @click="addPage">Add Form Page</button>
				</div>
			</n-form>
		</n-sidebar>
		<div class="form-tabs" v-if="cell.state.pages.length >= 2 && (cell.state.pageTabs || edit)">
			<button v-for="page in cell.state.pages" @click="setPage(page)"
				:class="{'is-active': currentPage == page}">{{$services.page.interpret(page.name, self)}}</button>
		</div>
		<h2 v-if="cell.state.title">{{$services.page.translate($services.page.interpret(cell.state.title, $self))}}</h2>
		<n-form :class="[cell.state.class, {'form-read-only': readOnly, 'form-edit': !readOnly}, {'form-error': !!error }]" ref="form" :id="cell.state.formId" :mode="cell.state.mode">
			<header slot="header" v-if="cell.state.dynamicHeader"><component :is="cell.state.dynamicHeader" :form="$self" :page="page" :cell="cell"/></header>
			<n-form-section :key="'form_page_' + cell.state.pages.indexOf(currentPage)">
				<n-form-section v-for="group in getGroupedFields(currentPage)" :class="group.group">
					<n-form-section v-for="field in group.fields" :key="field.name + '_section'" v-if="!isPartOfList(field.name) && !isHidden(field) && (!readOnly || !field.hideInReadOnly)">
						<component v-if="isList(field.name)"
							:is="getProvidedListComponent(field.type)"
							:value="result"
							:page="page"
							:cell="cell"
							:edit="edit"
							:field="field"
							@changed="changed"
							:timeout="cell.state.immediate ? 600 : 0"
							:schema="getSchemaFor(field.name)"/>
						<page-form-field v-else-if="!field.arbitrary" :key="field.name + '_value'" :field="field" :schema="getSchemaFor(field.name)" 
							:value="getCurrentValue(field)"
							:parent-value="result"
							:schema-resolver="getSchemaFor"
							@input="function(newValue) { $window.Vue.set(result, field.name, newValue); changed(); }"
							:timeout="cell.state.immediate ? 600 : 0"
							:page="page"
							:read-only="readOnly"
							:cell="cell"
							@label="function(value) { $window.Vue.set(labels, field.name, value) }"
							v-focus="cell.state.autofocus == true && currentPage.fields.indexOf(field) == 0"/>
						<page-arbitrary v-else
							:edit="edit"
							:page="page"
							:cell="cell"
							:target="field"
							:component="form"/>
					</n-form-section>
				</n-form-section>
			</n-form-section>
			<footer slot="footer">
				<footer v-if="cell.state.dynamicFooter" class="footer-custom"><component :is="cell.state.dynamicFooter" :read-only="readOnly" :form="$self" :page="page" :cell="cell"/></footer>
				<footer v-else-if="readOnly" class="footer-edit">
					<button class="form-edit" :id="cell.state.formId ? cell.state.formId + '_edit' : null" @click="readOnly = false" v-if="cell.state.edit || cell.state.editIcon">
						<span class="fa" :class="cell.state.editIcon" v-if="cell.state.editIcon"></span>
						<span>{{$services.page.translate($services.page.interpret(cell.state.edit, $self))}}</span>
					</button>
				</footer>
				<footer class="global-actions footer-standard" v-else-if="!cell.state.immediate">
					<a class="cancel" :disabled="doingIt" href="javascript:void(0)" @click="cancel" :id="cell.state.formId ? cell.state.formId + '_cancel' : null" 
						v-if="cell.state.cancel && (!cell.state.previous || cell.state.pages.indexOf(currentPage) == 0)">{{$services.page.translate($services.page.interpret(cell.state.cancel, $self))}}</a>
					<a class="previous" :disabled="doingIt" href="javascript:void(0)" @click="previousPage" :id="cell.state.formId ? cell.state.formId + '_previous' : null" 
						v-if="cell.state.previous && cell.state.pages.indexOf(currentPage) > 0">{{$services.page.translate($services.page.interpret(cell.state.previous, $self))}}</a>
					<button class="primary" :id="cell.state.formId ? cell.state.formId + '_next' : null" @click="nextPage" 
						v-if="cell.state.next && cell.state.pages.indexOf(currentPage) < cell.state.pages.length - 1">{{$services.page.translate($services.page.interpret(cell.state.next, $self))}}</button>
					<button :disabled="doingIt" class="primary" :id="cell.state.formId ? cell.state.formId + '_submit' : null" @click="doIt" 
						v-else-if="cell.state.ok">{{$services.page.translate($services.page.interpret(cell.state.ok, $self))}}</button>
					<button class="secondary" :id="cell.state.formId ? cell.state.formId + '_submit' : null" @click="doIt" 
						:disabled="doingIt"
						v-if="cell.state.pages.length >= 2 && cell.state.partialSubmit && cell.state.next && cell.state.pages.indexOf(currentPage) < cell.state.pages.length - 1 && cell.state.ok">{{$services.page.translate($services.page.interpret(cell.state.ok, $self))}}</button>
				</footer>
				<footer class="footer-messages">
					<n-messages :messages="messages"/>
				</footer>
			</footer>
		</n-form>
	</div>
</template>

<template id="page-form-field">
	<component
		:readOnly="readOnly"
		:placeholder="field.placeholder ? $services.page.translate(field.placeholder) : null"
		class="page-form-field"
		:is="getProvidedComponent(field.type)"
		:value="usesMultipleFields(field.type) ? parentValue : value"
		:page="page"
		:cell="cell"
		:field="field"
		@input="function(newValue) { $emit('input', newValue) }"
		v-bubble:label
		:label="field.hideLabel ? null : $services.page.translate($services.page.interpret(fieldLabel, $self))"
		:timeout="timeout"
		:schema="schema"
		:schema-resolver="schemaResolver"
		:disabled="isDisabled"/>
</template>

<template id="page-form-configure">
	<n-collapsible class="list" :title="title">
		<div class="root-configuration">
			<n-form-text :value="title" label="Form Page Name" v-if="editName" v-bubble:input/>
		</div>
		<div class="list-actions">
			<button @click="addField(false)">Add Field</button>
			<button @click="addField(true)">Add Content</button>
		</div>
		<n-collapsible class="field list-item" v-for="field in fields" :title="field.label ? field.label : field.name">
			<page-configure-arbitrary v-if="field.arbitrary" 
				:page="page"
				:cell="cell"
				:target="field"
				:keys="possibleFields"/>
				
			<page-form-configure-single v-else :field="field" :possible-fields="possibleFields"
				:groupable="groupable"
				:hidable="true"
				:is-list="isList"
				:page="page"
				:schema="schemaResolver(field.name)"
				:cell="cell"/>
				
			<n-form-switch v-model="field.hideInReadOnly" v-if="allowReadOnly" label="Hide In Read Only Mode"/>
			<div class="list-item-actions">
				<button @click="upAll(field)"><span class="fa fa-chevron-circle-left"></span></button>
				<button @click="up(field)"><span class="fa fa-chevron-circle-up"></span></button>
				<button @click="down(field)"><span class="fa fa-chevron-circle-down"></span></button>
				<button @click="downAll(field)"><span class="fa fa-chevron-circle-right"></span></button>
				<button @click="fields.splice(fields.indexOf(field), 1)"><span class="fa fa-trash"></span></button>
			</div>
		</n-collapsible>
	</n-collapsible>
</template>

<template id="page-form-configure-single">
	<div class="page-form-single-field">
		<n-form-combo v-model="field.name" label="Field Name" :items="possibleFields" v-if="!usesMultipleFields(field.type)"/>
		<n-form-text v-model="field.label" label="Label" v-if="allowLabel" />
		<n-form-text v-model="field.placeholder" label="Placeholder" />
		<n-form-text v-model="field.hidden" label="Hide field if" v-if="hidable" />
		<n-form-text v-model="field.group" label="Field Group" v-if="groupable && !field.joinGroup" />
		<n-form-checkbox v-model="field.joinGroup" label="Join Field Group" v-if="groupable && !field.group" />
		<n-form-text v-model="field.description" label="Description" v-if="allowDescription" />
		<n-form-combo v-model="field.type" label="Type" :items="types"/>
		<n-form-text v-model="field.value" v-if="field.type == 'fixed'" label="Fixed Value"/>
		<n-form-switch v-model="field.hideLabel" label="Hide label"/>
		
		<component v-if="field.type && ['fixed'].indexOf(field.type) < 0"
			:possible-fields="possibleFields"
			:is="getProvidedConfiguration(field.type)"
			:page="page"
			:cell="cell"
			:schema="schema"
			:field="field"/>
			
	</div>
</template>

<template id="page-configure-arbitrary">
	<div class="page-configure-arbitrary">
		<n-form-text v-model="target.label" label="Label"/>
		<n-form-text v-model="target.class" label="Class"/>
		<n-form-combo v-model="target.route" label="Route" :filter="filterRoutes"/>
		<n-page-mapper v-if="target.route" :to="getTargetParameters(target)"
			:from="availableParameters" 
			v-model="target.bindings"/>
	</div>
</template>

<template id="page-arbitrary">
	<div class="page-arbitrary">
		<div v-if="instance && instance.configure && edit" class="page-arbitrary-menu">
			<button @click="function($event) { instance.configure(); $event.stopPropagation(); return false }"><span class="fa fa-cog"></span></button>
		</div>
		<div :class="target.class" v-route-render="{ alias: target.route, parameters: getParameters(), mounted: mounted }"></div>
	</div>
</template>
<template id="page-fields-edit">
	<n-collapsible title="Fields" class="page-fields list">
		<div class="list-actions" v-if="allowMultiple">
			<button @click="addField(false)">Add Field</button>
			<button @click="addField(true)">Add Content</button>
		</div>
		<n-collapsible class="list-item" :title="field.label ? field.label : 'Unlabeled'" v-for="field in cell.state[fieldsName]">
			<n-form-text v-model="field.label" label="Field Label"/>
			<n-form-text v-if="!basic" v-model="field.hidden" label="Hide field if"/>
			<n-form-text v-model="field.info" label="Info Content"/>
			<n-form-text v-model="field.infoIcon" label="Info Icon" v-if="field.info"/>
			<div v-if="!field.arbitrary">
				<div class="list-item-actions">
					<button @click="addFragment(field)">Add Fragment</button>
					<button v-if="allowMultiple" @click="cell.state[fieldsName].splice(cell.state[fieldsName].indexOf(field), 1)">Remove Field</button>
					<button v-if="allowMultiple" @click="fieldBeginning(field)"><span class="fa fa-chevron-circle-left"></span></button>
					<button v-if="allowMultiple" @click="fieldUp(field)"><span class="fa fa-chevron-circle-up"></span></button>
					<button v-if="allowMultiple" @click="fieldDown(field)"><span class="fa fa-chevron-circle-down"></span></button>
					<button v-if="allowMultiple" @click="fieldEnd(field)"><span class="fa fa-chevron-circle-right"></span></button>
				</div>
				<n-collapsible :title="fragment.key ? fragment.key : fragment.type" v-for="fragment in field.fragments">
					<n-form-combo v-model="fragment.type" label="Fragment Type" :items="fragmentTypes"/>
					<n-form-text v-if="!basic" v-model="fragment.hidden" label="Hide fragment if"/>
					<n-form-combo v-if="fragment.type == 'data'" v-model="fragment.key" label="Data Key" :filter="getKeys"/>
					<n-form-text v-if="!basic" v-model="fragment.class" label="Fragment Class"/>
					<page-event-value v-if="allowEvents" :page="page" :container="fragment" title="Click Event" name="clickEvent" v-bubble:resetEvents/>
					
					<component v-if="fragment.type" :cell="cell" :page="page" :keys="getKeys()"
						:fragment="fragment"
						:is="getProvidedConfiguration(fragment.type)"/>
						
					<div class="list-item-actions">
						<button @click="up(field, fragment)"><span class="fa fa-chevron-circle-up"></span></button>
						<button @click="down(field, fragment)"><span class="fa fa-chevron-circle-down"></span></button>
						<button @click="field.fragments.splice(field.fragments.indexOf(fragment), 1)"><span class="fa fa-trash"></span></button>
					</div>
				</n-collapsible>
			</div>
			<div v-else>
				<div class="list-item-actions">
					<button v-if="allowMultiple" @click="cell.state[fieldsName].splice(cell.state[fieldsName].indexOf(field), 1)">Remove Content</button>
					<button v-if="allowMultiple" @click="fieldBeginning(field)"><span class="fa fa-chevron-circle-left"></span></button>
					<button v-if="allowMultiple" @click="fieldUp(field)"><span class="fa fa-chevron-circle-up"></span></button>
					<button v-if="allowMultiple" @click="fieldDown(field)"><span class="fa fa-chevron-circle-down"></span></button>
					<button v-if="allowMultiple" @click="fieldEnd(field)"><span class="fa fa-chevron-circle-right"></span></button>
				</div>
				<page-configure-arbitrary
					:page="page"
					:cell="cell"
					:target="field"
					:keys="getKeys()"/>
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
		<n-form-combo label="Date Format" v-if="fragment.format == 'date'" v-model="fragment.dateFormat" :filter="function(value) { return [value, 'date', 'dateTime', '\'yy MMM dd', '\'yy MMM dd HH:mm', 'MMMM dd, yyyy'] }"/>
		<n-form-switch label="Is timestamp in milliseconds?" v-model="fragment.isTimestamp" v-if="fragment.format == 'date' && !fragment.isSecondsTimestamp"/>
		<n-form-switch label="Is timestamp in seconds?" v-model="fragment.isSecondsTimestamp" v-if="fragment.format == 'date' && !fragment.isTimestamp"/>
		<n-form-combo label="Type" v-model="fragment.tag" :items="['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div']"/>
		<component v-if="isProvided(fragment.format) && getConfiguration(fragment.format)"
			:is="getConfiguration(fragment.format)"
			:page="page" 
			:cell="cell"
			:fragment="fragment"/>
	</div>
</template>

<template id="page-field">
	<div class="page-field" :class="getDynamicClasses(field)" @click="trigger(fieldAction)">
		<template v-if="label">
			<dt v-if="label && field.label">{{$services.page.translate($services.page.interpret(field.label,$self))}}</dt>
			<dd class="page-field-fragment" v-if="!field.arbitrary">
				<component v-if="fragment.type && !isHidden(fragment)" 
					:class="[$services.page.interpret(fragment.class, $self), {'clickable': hasClickEvent(fragment)}]" v-for="fragment in field.fragments"
					:is="getProvidedComponent(fragment.type)"
					:page="page" 
					:cell="cell"
					:data="data"
					:fragment="fragment"
					@click.native="handleClick(fragment)"
					@updated="function(value) { $emit('updated', value) }"/>
			</dd>
			<dd class="page-field-fragment" v-else>
				<page-arbitrary
					:edit="edit"
					:page="page"
					:cell="cell"
					:target="field"
					:component="$self"
					:record="data"/>
			</dd>
			<dd v-if="otherActions.length">
				<button v-if="!action.condition || $services.page.isCondition(action.condition, {record:record}, $self)" 
					v-for="action in otherActions" 
					@click="trigger(action)"
					:class="[action.class, {'has-icon': action.icon}, {'inline': !action.class }]"><span class="fa" v-if="action.icon" :class="action.icon"></span><label v-if="action.label">{{$services.page.translate(action.label)}}</label></button>
			</dd>
		</template>
		<template v-else-if="!field.arbitrary">
			<component v-if="!isHidden(fragment)"
				class="page-field-fragment" :class="[$services.page.interpret(fragment.class, $self), {'clickable': hasClickEvent(fragment)}]" v-for="fragment in field.fragments"
				:is="getProvidedComponent(fragment.type)"
				:page="page" 
				:cell="cell"
				:data="data"
				:fragment="fragment"
				@click.native="handleClick(fragment)"
				@updated="function(value) { $emit('updated', value) }"/>
			<span v-if="otherActions.length">
				<button v-if="!action.condition || $services.page.isCondition(action.condition, {record:record}, $self)" 
					v-for="action in otherActions" 
					@click="trigger(action)"
					:class="[action.class, {'has-icon': action.icon}, {'inline': !action.class }]"><span class="fa" v-if="action.icon" :class="action.icon"></span><label v-if="action.label">{{$services.page.translate(action.label)}}</label></button>
			</span>
		</template>
		<template v-else>
			<page-arbitrary
				:edit="edit"
				:page="page"
				:cell="cell"
				:target="field"
				:component="$self"
				:record="data"/>
			<span v-if="otherActions.length">
				<button v-if="!action.condition || $services.page.isCondition(action.condition, {record:record}, $self)" 
					v-for="action in otherActions" 
					@click="trigger(action)"
					:class="[action.class, {'has-icon': action.icon}, {'inline': !action.class }]"><span class="fa" v-if="action.icon" :class="action.icon"></span><label v-if="action.label">{{$services.page.translate(action.label)}}</label></button>
			</span>
		</template>
	</div>
</template>

<template id="page-fields">
	<dl class="page-fields" :class="cell.state.class">
		<n-sidebar @close="configuring = false" v-if="configuring" class="settings" :inline="true">
			<n-form class="layout2">
				<n-collapsible title="Field Settings">
					<n-form-text v-model="cell.state.class" label="Class"/>
					<n-form-switch v-model="cell.state.hideLabel" label="Hide label" v-if="label == null"/>
				</n-collapsible>
				<page-fields-edit :cell="cell" :allow-multiple="true" :page="page" :data="data" :should-style="shouldStyle"/>
			</n-form>
		</n-sidebar>
		<page-field v-for="field in cell.state[fieldsName]" :field="field" :data="data ? data : state" :label="label == null ? !cell.state.hideLabel : label"
			v-if="!field.hidden || !$services.page.isCondition(field.hidden, data ? data : state, $self)"
			:edit="edit"
			:page="page"
			:cell="cell"
			:should-style="shouldStyle"
			@updated="function(value) { $emit('updated', value) }"/>
	</dl>
</template>
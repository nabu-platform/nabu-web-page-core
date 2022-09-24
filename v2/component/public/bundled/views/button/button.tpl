<template id="page-button">
	<button class="is-button" @click="handle($event)" :disabled="running || disabled" :class="[getChildComponentClasses('page-button'), {'is-active': active || activated}]" 
			:component-group="cell.state.componentGroup">
		<img :src="cell.state.icon.indexOf('http') == 0 ? cell.state.icon : '${server.root()}resources/' + cell.state.icon" v-if="cell.state.icon && cell.state.icon.match(/^.*\.[^.]+$/)" class="is-icon"/>
		<icon :name="cell.state.icon" v-if="cell.state.icon"/>
		<span class="is-text" v-if="cell.state.content && !edit" v-html="$services.page.translate(getContentWithVariables($services.page.interpret(cell.state.content, $self)))"></span>
		<span class="is-text is-inline-editor" v-else-if="edit" 
			v-html-once="cell.state.content ? cell.state.content : null"
			ref="editor"
			@keyup="update" @blur="update" @input="update"
			:contenteditable="true"
			placeholder="Button label"></span>
		<span class="is-badge" v-if="cell.state.badge" v-html="cell.state.badge"></span>
	</button>
</template>

<template id="page-button-configure">
	<div class="is-column">
		
		<div class="is-column is-spacing-medium">
			<n-form-text v-model="cell.state.icon" label="Icon" :timeout="600"/>
			<n-form-switch v-model="cell.state.stopPropagation" label="Stop click propagation"/>
			<n-form-switch v-model="cell.state.emitClose" label="Emit close on click" v-if="false"/>
			<n-form-text v-model="cell.state.componentGroup" label="Button group" after="You can add this button to a button group which will determine group behavior"
				placeholder="E.g. myTabs"
				:timeout="600"/>
			<n-form-switch v-model="cell.state.activateByDefault" v-if="cell.state.componentGroup" label="Have this button active by default"/>
			<n-form-ace mode="javascript" v-model="cell.state.disabled" label="Disabled if"/>
			<n-form-ace mode="javascript" v-model="cell.state.active" label="Active if" v-if="!cell.state.componentGroup"/>
		</div>
		
		<page-triggerable-configure :page="page" :target="cell.state" :triggers="{'click': {}}" :allow-closing="true"/>
		
		<typography-variable-replacer :content="cell.state.content" :container="cell.state" :page="page"/>
	</div>
</template>
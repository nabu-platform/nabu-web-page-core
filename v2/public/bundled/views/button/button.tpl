<template id="page-button">
	<button class="is-button" @click="handle($event)" :disabled="running" :class="getChildComponentClasses('page-button')">
		<img :src="cell.state.icon.indexOf('http') == 0 ? cell.state.icon : '${server.root()}resources/' + cell.state.icon" v-if="cell.state.icon && cell.state.icon.match(/^.*\.[^.]+$/)" class="is-icon"/>
		<icon :name="cell.state.icon" v-if="cell.state.icon"/>
		<span class="is-text" v-if="cell.state.content && !edit" v-html="$services.page.translate($services.page.interpret(cell.state.content, $self))"></span>
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
	<div>
		<n-form-switch v-model="cell.state.stopPropagation" label="Stop click propagation"/>
		<n-form-switch v-model="cell.state.emitClose" label="Emit close on click"/>
		<n-form-combo v-model="cell.state.route" v-if="(!cell.state.clickEvent || !cell.state.clickEvent.name) && !cell.state.url && !cell.state.action" 
			:filter="$services.page.getPageRoutes" 
			:formatter="function(x) { return $services.page.prettifyRouteAlias(x.alias) }" 
			:extracter="function(x) { return x.alias }" 
			label="Route to page"/>
		<page-event-value v-if="!cell.state.route && !cell.state.url && !cell.state.action" :page="page" :container="cell.state" title="Click Event" name="clickEvent" @resetEvents="resetEvents" :inline="true"/>
		<n-page-mapper v-if="cell.state.route && $services.router.get(cell.state.route)" :to="$services.page.getRouteParameters($services.router.get(cell.state.route))"
			:from="$services.page.getAvailableParameters(page, cell)" 
			v-model="cell.state.bindings"/>
			
		<n-form-combo v-model="cell.state.action" v-if="!cell.state.route && (!cell.state.clickEvent || !cell.state.clickEvent.name) && !cell.state.url"
			label="Run action"
			:filter="$services.page.getAvailableActions.bind($self, $services.page.getPageInstance(page, $self))"
			:formatter="function(x) { return x.title ? x.title : x.name }"
			:extracter="function(x) { return x.name }"
			/>
			
		<n-form-combo v-model="cell.state.actionTarget" v-if="cell.state.action"
			label="Action target"
			:filter="$services.page.getActionTargets.bind($self, $services.page.getPageInstance(page, $self), cell.state.action)"
			:formatter="function(x) { return x.name  ? x.name : (x.alias ? $services.page.prettifyRouteAlias(x.alias) : x.id) }"
			:extracter="function(x) { return x.id }"
			/>
			
		<n-form-text v-model="cell.state.actionEvent" 
			label="Output event"
			after="This action has an output which we can emit as an event"
			v-if="cell.state.action && cell.state.actionTarget && $services.page.getActionOutput($services.page.getPageInstance(page, $self), cell.state.actionTarget, cell.state.action)"
			/>
	</div>
</template>
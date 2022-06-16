<template id="page-button">
	<button class="is-button" @click="handle($event)" :disabled="running" :class="[getChildComponentClasses('page-button'), {'is-active': active}]">
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
			<n-form-text v-model="cell.state.icon" label="Icon"/>
			<n-form-switch v-model="cell.state.stopPropagation" label="Stop click propagation"/>
			<n-form-switch v-model="cell.state.emitClose" label="Emit close on click" v-if="false"/>
		</div>
		
		<page-triggerable-configure :page="page" :target="cell.state" :triggers="{'click': {}}" :allow-closing="true"/>
		
		<div v-if="false">
		<n-form-combo v-model="cell.state.route" v-if="(!cell.state.clickEvent || !cell.state.clickEvent.name) && !cell.state.url && !cell.state.action" 
			:filter="$services.page.getPageRoutes" 
			:formatter="function(x) { return $services.page.prettifyRouteAlias(x.alias) }" 
			:extracter="function(x) { return x.alias }" 
			label="Route to page"
			key="button-route"/>
		<page-event-value v-if="!cell.state.route && !cell.state.url && !cell.state.action" :page="page" :container="cell.state" title="Click Event" name="clickEvent" @resetEvents="resetEvents" :inline="true"/>
		<n-page-mapper v-if="cell.state.route && $services.router.get(cell.state.route)" :to="$services.page.getRouteParameters($services.router.get(cell.state.route))"
			:from="$services.page.getAvailableParameters(page, cell)" 
			key="button-route-mapper"
			v-model="cell.state.bindings"/>
			
		<div v-if="cell.state.route" class="is-column is-spacing-vertical-gap-medium">
			<div class="is-row is-align-end">
				<button class="is-button is-variant-primary-outline is-size-xsmall has-tooltip" @click="cell.state.activeRoutes.push({})">
					<icon name="plus"/>
					<span class="is-text">Active Route</span>
					<span class="is-tooltip is-position-left">The button will be visually marked when its route is active. You can add other routes when the button should be considered active as well.</span>
				</button>
			</div>
			<div v-for="index in $window.Object.keys(cell.state.activeRoutes)" class="has-button-close">
				<n-form-combo v-model="cell.state.activeRoutes[index]"
					:filter="$services.page.getPageRoutes"
					:formatter="function(x) { return $services.page.prettifyRouteAlias(x.alias) }" 
					:extracter="function(x) { return x.alias }" :key="'active-route-' + index"/>
				<button class="is-button is-variant-close is-size-small is-spacing-horizontal-right-large" @click="cell.state.activeRoutes.splice(index, 1)"><icon name="times"/></button>
			</div>
		</div>
			
		<n-form-combo v-model="cell.state.action" v-if="!cell.state.route && (!cell.state.clickEvent || !cell.state.clickEvent.name) && !cell.state.url"
			label="Run action"
			:filter="$services.page.getAvailableActions.bind($self, $services.page.getPageInstance(page, $self))"
			:formatter="function(x) { return x.title ? x.title : x.name }"
			:extracter="function(x) { return x.name }"
			@input="cell.state.actionTarget = null"
			key="button-action"
			/>
			
		<n-form-combo v-model="cell.state.actionTarget" v-if="cell.state.action"
			label="Action target"
			:filter="$services.page.getActionTargets.bind($self, $services.page.getPageInstance(page, $self), cell.state.action)"
			:formatter="function(x) { return x.name  ? x.name : (x.alias ? $services.page.prettifyRouteAlias(x.alias) : x.id) }"
			:extracter="function(x) { return x.id }"
			key="button-action-target"
			/>
			
		<n-page-mapper v-if="cell.state.action && cell.state.actionTarget && $services.page.getActionInput($services.page.getPageInstance(page, $self), cell.state.actionTarget, cell.state.action)" 
			:to="{properties:$services.page.getActionInput($services.page.getPageInstance(page, $self), cell.state.actionTarget, cell.state.action)}"
			:from="$services.page.getAvailableParameters(page, cell)" 
			key="button-action-mapper"
			v-model="cell.state.bindings"/>
			
		<n-form-text v-model="cell.state.actionEvent" 
			:timeout="600"
			label="Output event"
			after="This action does not have an output but you may want to send an event when it is done"
			v-if="cell.state.action && cell.state.actionTarget && !$services.page.getActionOutput($services.page.getPageInstance(page, $self), cell.state.actionTarget, cell.state.action)"
			/>
			
		<n-form-text v-model="cell.state.actionEvent" 
			:timeout="600"
			label="Output event"
			after="This action has an output which we can emit as an event"
			v-else-if="cell.state.action && cell.state.actionTarget"
			/>
			
		<n-form-text v-model="cell.state.url" label="URL to redirect to" v-if="!cell.state.route && (!cell.state.clickEvent || !cell.state.clickEvent.name) && !cell.state.action" :timeout="600"/>
		
		<n-form-combo v-model="cell.state.anchor" v-show="cell.state.url || cell.state.route" label="Anchor" :items="['$blank', '$window']"
			key="button-anchor"/>
			
		</div>
			
			
		<typography-variable-replacer :content="cell.state.content" :container="cell.state" :page="page"/>
	</div>
</template>
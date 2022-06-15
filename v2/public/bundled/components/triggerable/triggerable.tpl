<template id="page-triggerable-configure">
	<div class="is-column is-spacing-vertical-gap-medium">
		<div class="is-row is-align-end is-spacing-horizontal-right-medium">
			<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addTrigger"><icon name="plus"/><span class="is-title">Trigger</span></button>
		</div>
		<div class="is-accordion">
			<n-collapsible  class="is-highlight-left is-color-primary-light" :is-only-one-open="true" :title="'On ' + (trigger.trigger ? trigger.trigger : '?')" v-for="(trigger, triggerIndex) in target[name]" content-class="is-spacing-medium" :start-open="false && triggerIndex == 0">
				<ul slot="buttons" class="is-menu is-variant-toolbar is-align-end is-spacing-horizontal-right-medium">
					<li class="is-column"><button class="is-button is-size-xsmall is-variant-danger-outline" @click="target[name].splice(triggerIndex, 1)"><icon name="times"/></button></li>
				</ul>
				<n-form-combo v-model="trigger.trigger" v-if="getTriggerNames().length >= 2" :filter="getTriggerNames" label="Trigger On"/>
				<n-form-text v-model="trigger.condition" label="Condition" after="You can configure an additional condition that must evaluate to true before the trigger is activated"/>
				<n-form-text v-model="trigger.confirmation" label="Confirmation message" after="You can prompt the user for additional confirmation before executing the trigger"/>
				<div v-for="(action, actionIndex) in trigger.actions" class="is-column is-spacing-medium is-color-body">
					<div class="is-row is-align-end">
						<button class="is-button is-variant-ghost is-size-xsmall" @click="actionUp(trigger, action)"><icon name="chevron-up"/></button>
						<button class="is-button is-variant-ghost is-size-xsmall" @click="actionDown(trigger, action)"><icon name="chevron-down"/></button>
						<button class="is-button is-variant-ghost is-size-xsmall" @click="trigger.actions.splice(actionIndex, 1)"><icon name="times"/></button>
					</div>
					<n-form-text v-model="action.condition" label="Condition" after="You can configure an additional condition that must evaluate to true before this action is triggered. If not triggered, we continue to the next action."/>
					<n-form-combo v-model="action.route" v-if="(!action.event || !action.event.name) && !action.url && !action.action" 
						:filter="$services.page.getPageRoutes" 
						:formatter="function(x) { return $services.page.prettifyRouteAlias(x.alias) }" 
						:extracter="function(x) { return x.alias }" 
						label="Route to page"
						key="button-route"/>
					<page-event-value v-if="!action.route && !action.url && !action.action" :page="page" :container="action" title="Event to emit" name="event" @resetEvents="resetEvents" :inline="true"/>
					<n-page-mapper v-if="action.route && $services.router.get(action.route)" :to="$services.page.getRouteParameters($services.router.get(action.route))"
						:from="$services.page.getAvailableParameters(page, cell)" 
						key="button-route-mapper"
						v-model="action.bindings"/>
						
					<div v-if="action.route" class="is-column is-spacing-vertical-gap-medium">
						<div class="is-row is-align-end">
							<button class="is-button is-variant-primary-outline is-size-xsmall has-tooltip" @click="action.activeRoutes.push({})">
								<icon name="plus"/>
								<span class="is-text">Active Route</span>
								<span class="is-tooltip is-position-left">The button will be visually marked when its route is active. You can add other routes when the button should be considered active as well.</span>
							</button>
						</div>
						<div v-for="index in $window.Object.keys(action.activeRoutes)" class="has-button-close">
							<n-form-combo v-model="action.activeRoutes[index]"
								:filter="$services.page.getPageRoutes"
								:formatter="function(x) { return $services.page.prettifyRouteAlias(x.alias) }" 
								:extracter="function(x) { return x.alias }" :key="'active-route-' + index"/>
							<button class="is-button is-variant-close is-size-small is-spacing-horizontal-right-large" @click="action.activeRoutes.splice(index, 1)"><icon name="times"/></button>
						</div>
					</div>
						
					<n-form-combo v-model="action.action" v-if="!action.route && (!action.event || !action.event.name) && !action.url"
						label="Run action"
						:filter="$services.page.getAvailableActions.bind($self, $services.page.getPageInstance(page, $self))"
						:formatter="function(x) { return x.title ? x.title : x.name }"
						:extracter="function(x) { return x.name }"
						@input="action.actionTarget = null"
						key="button-action"
						/>
						
					<n-form-combo v-model="action.actionTarget" v-if="action.action"
						label="Action target"
						:filter="$services.page.getActionTargets.bind($self, $services.page.getPageInstance(page, $self), action.action)"
						:formatter="function(x) { return x.name  ? x.name : (x.alias ? $services.page.prettifyRouteAlias(x.alias) : x.id) }"
						:extracter="function(x) { return x.id }"
						key="button-action-target"
						/>
						
					<n-page-mapper v-if="action.action && action.actionTarget && $services.page.getActionInput($services.page.getPageInstance(page, $self), action.actionTarget, action.action)" 
						:to="{properties:$services.page.getActionInput($services.page.getPageInstance(page, $self), action.actionTarget, action.action)}"
						:from="$services.page.getAvailableParameters(page, cell)" 
						key="button-action-mapper"
						v-model="action.bindings"/>
						
					<n-form-text v-model="action.actionEvent" 
						:timeout="600"
						label="Output event"
						after="This action does not have an output but you may want to send an event when it is done"
						v-if="action.action && action.actionTarget && !$services.page.getActionOutput($services.page.getPageInstance(page, $self), action.actionTarget, action.action)"
						/>
						
					<n-form-text v-model="action.actionEvent" 
						:timeout="600"
						label="Output event"
						after="This action has an output which we can emit as an event"
						v-else-if="action.action && action.actionTarget"
						/>
						
					<n-form-text v-model="action.url" label="URL to redirect to" v-if="!action.route && (!action.event || !action.event.name) && !action.action" :timeout="600"/>
					
					<n-form-combo v-model="action.anchor" v-show="action.url || action.route" label="Anchor" :items="['$blank', '$window']"
						key="button-anchor"/>
						
				</div>
				
				<div class="is-row is-align-end">
					<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addAction(trigger)"><icon name="plus"/><span class="is-title">Action</span></button>
				</div>
			</n-collapsible>
		</div>
	</div>
</template>
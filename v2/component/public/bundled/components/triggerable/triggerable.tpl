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
				<n-form-text v-if="false" v-model="trigger.confirmation" label="Confirmation message" after="You can prompt the user for additional confirmation before executing the trigger"/>
				<n-form-switch v-model="trigger.closeEvent" label="Send close event once done" after="We can emit a close once our trigger is done, closing any window it is in" v-if="allowClosing"/>
				<n-form-text v-model="trigger.errorEvent" label="Error event name" after="You can choose to emit an event if this trigger fails" :timeout="600"/>
				<div v-for="(action, actionIndex) in trigger.actions" class="is-column is-spacing-medium is-color-body">
					<div class="is-row is-align-end">
						<button class="is-button is-variant-ghost is-size-xsmall" @click="actionUp(trigger, action)"><icon name="chevron-up"/></button>
						<button class="is-button is-variant-ghost is-size-xsmall" @click="actionDown(trigger, action)"><icon name="chevron-down"/></button>
						<button class="is-button is-variant-ghost is-size-xsmall" @click="trigger.actions.splice(actionIndex, 1)"><icon name="times"/></button>
					</div>
					
					<n-form-text v-model="action.condition" label="Condition" after="You can configure an additional condition that must evaluate to true before this action is triggered. If not triggered, we continue to the next action."
						:timeout="600"/>
					
					<n-form-radio :items="actionTypes" label="Type of action" v-model="action.type"
						v-if="!action.type"
						:formatter="function(x) { return x.title }"
						:extracter="function(x) { return x.name }"/>
					
					<div v-if="action.type == 'route'" class="is-column is-spacing-gap-medium">
						<n-form-combo v-model="action.route" v-if="!action.url && !action.routeAsFormula" 
							:filter="$services.page.getPageRoutes" 
							:formatter="function(x) { return $services.page.prettifyRouteAlias(x.alias) }" 
							:extracter="function(x) { return x.alias }" 
							label="Route to another page in the application"
							key="button-route"/>
							
						<n-form-ace v-model="action.routeFormula" label="Route formula" v-if="!action.url && !action.route && action.routeAsFormula"/>
						<n-form-switch v-model="action.routeAsFormula" label="Use formula for route" v-if="!action.url && !action.route"/>
							
						<n-page-mapper v-if="action.route && $services.router.get(action.route)" :to="$services.page.getRouteParameters($services.router.get(action.route))"
							:from="getAvailableParameters(trigger, action)" 
							:key="action.route + '-mapper'"
							v-model="action.bindings"/>
							
						<n-form-text v-model="action.url" label="Route to an external URL" v-if="!action.route && !action.routeFormula" :timeout="600"/>
					
						<n-form-combo v-model="action.anchor" v-show="action.url || action.route" label="Anchor" :filter="getAnchors"
							key="button-anchor"/>
						
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
						
						<n-form-switch v-model="action.mask" label="Mask the routing" v-if="action.route || action.routeFormula"/>
						
						<div class="is-alert is-variant-danger-outline is-size-small"><span class="is-text">A route action is the final action, anything after this might not get executed</span></div>
					</div>
					
					<div v-else-if="action.type == 'event'" class="is-column is-spacing-gap-medium">
						<page-event-value :page="page" :container="action" title="Event to emit" name="event" @resetEvents="resetEvents" :inline="true" :allow-fields="!action.eventContent"/>
						<n-form-combo v-model="action.eventContent" :items="$window.Object.keys($services.triggerable.getInternalState(page, trigger, action))" label="Event content" after="Choose the event content from the available state"
							v-if="!action.event || !action.event.eventFields || !action.event.eventFields.length"
							@input="resetEvents"/>
					</div>
					
					<div v-else-if="action.type == 'notification'" class="is-column is-spacing-gap-medium">
						<n-form-text v-model="action.notificationDuration" label="Duration" :timeout="600" info="How long the notification should stay up (in ms)"/>
						<n-form-text v-model="action.notificationTitle" label="Title" :timeout="600" info="An optional title for this notification, it can include variables from the originating event using the {{}} syntax"/>
						<n-form-text v-model="action.notificationMessage" label="Message" :timeout="600" info="An optional title for this notification, it can include variables from the originating event using the {{}} syntax"/>
						<n-form-combo v-model="action.notificationColor" label="Color" :filter="getAvailableColors" />
						<n-form-combo v-model="action.notificationSeverity" label="Severity" :timeout="600" :items="['success', 'warning', 'error', 'info', 'danger']" :placeholder="info" v-if="false"/>
						<n-form-text v-model="action.notificationIcon" label="Icon" :timeout="600" info="The correct value for this depends on your icon provider"/>
						<n-form-switch v-model="action.notificationCloseable" label="Closeable" info="Can the user explicitly close the notification?"/>
					</div>
					
					<div v-else-if="action.type == 'action'" class="is-column is-spacing-gap-medium">
						<n-form-combo v-model="action.action"
							label="Action to run"
							:filter="$services.page.getAvailableActions.bind($self, $services.page.getPageInstance(page, $self))"
							:formatter="function(x) { return x.title ? x.title : x.name }"
							:extracter="function(x) { return x.name }"
							@input="action.actionTarget = null"
							key="button-action"
							/>
							
						<n-form-combo v-model="action.actionTarget" v-if="action.action"
							label="The target you want to run the action on"
							:filter="$services.page.getActionTargets.bind($self, $services.page.getPageInstance(page, $self), action.action)"
							:formatter="function(x) { return x.name  ? x.name : (x.alias ? $services.page.prettifyRouteAlias(x.alias) : x.id) }"
							:extracter="function(x) { return x.id }"
							key="button-action-target"
							/>
							
						<n-page-mapper v-if="action.action && action.actionTarget && $services.page.getActionInput($services.page.getPageInstance(page, $self), action.actionTarget, action.action)" 
							:to="{properties:$services.page.getActionInput($services.page.getPageInstance(page, $self), action.actionTarget, action.action)}"
							:from="getAvailableParameters(trigger, action)" 
							key="button-action-mapper"
							v-model="action.bindings"/>
							
						<p class="is-p is-size-small" v-if="action.action && action.actionTarget && !$services.page.getActionOutput($services.page.getPageInstance(page, $self), action.actionTarget, action.action)">This action does not have an output</p>
						<div v-else-if="action.action && action.actionTarget">
							<p class="is-p is-size-small">This action has an output. If you emit an event after this action, it will (by default) have the content of the action output. You can also bind the result to a local variable to use in subsequent actions.</p>
							<n-form-text v-model="action.resultName" label="Local variable name of output"/>
						</div>
					</div>
					
					<div v-else-if="action.type == 'javascript'" class="is-column is-spacing-gap-medium">
						<n-form-ace v-model="action.javascript" label="Javascript to execute"/>	
					</div>
					
					<div v-else-if="action.type == 'confirmation'" class="is-column is-spacing-gap-medium">
						<n-form-text v-model="action.confirmation" label="Confirmation message"/>
					</div>
					
					<div v-else-if="action.type == 'operation'" class="is-column is-spacing-gap-medium">
						<n-form-combo :key="'operation' + page.content.actions.indexOf(action)" 
							:formatter="function(x) { return x.id }"
							:extracter="function(x) { return x.id }"
							v-model="action.operation" label="Operation" :filter="$services.page.getTriggerOperations" />
							
						<n-page-mapper v-if="action.operation" :to="$services.page.getSimpleKeysFor($services.page.getSwaggerOperationInputDefinition(action.operation), true)"
							:key="action.operation + '-mapper'"
							:from="getAvailableParameters(trigger, action)" 
							v-model="action.bindings"/>
							
						<n-form-text v-model="action.resultName" label="Local variable name of the operation output" v-if="action.operation && $window.Object.keys($services.page.getSwaggerOperationOutputDefinition(action.operation)).length > 0"
							after="You can capture the output of this service to use in further actions"/>
					</div>
					
					<div v-else-if="action.type == 'download'" class="is-column is-spacing-gap-medium">
						<n-form-combo :key="'operation' + page.content.actions.indexOf(action)" 
							:formatter="function(x) { return x.id }"
							:extracter="function(x) { return x.id }"
							v-model="action.operation" label="Operation" :filter="$services.page.getDownloadOperations" />
						
						<n-form-text label="File name" v-model="action.fileName"/>
						
						<n-page-mapper v-if="action.operation" :to="$services.page.getSimpleKeysFor($services.page.getSwaggerOperationInputDefinition(action.operation), true)"
							:key="action.operation + '-mapper'"
							:from="getAvailableParameters(trigger, action)" 
							v-model="action.bindings"/>
							
						<n-form-combo v-if="action.operation && $services.swagger.operations[action.operation]['x-downloadable'] == 'true'"
							label="Download as"
							v-model="action.downloadAs"
							:items="['excel', 'csv', 'json', 'xml']"/>
					</div>
					
					<div v-else-if="action.type == 'function'" class="is-column is-spacing-gap-medium">
						<n-form-combo v-model="action.function" label="Function" :filter="$services.page.listFunctions" />
						<n-form-text v-if="action.function && $services.page.hasFunctionOutput(action.function)" v-model="action.resultName" label="Local variable name of the function output"/>
						
						<n-page-mapper v-if="action.function" 
							:to="$services.page.getFunctionInput(action.function)"
							:from="getAvailableParameters(trigger, action)" 
							key="button-function-mapper"
							v-model="action.bindings"/>
					</div>
						
				</div>
				
				<div class="is-row is-align-end">
					<button class="is-button is-variant-primary-outline is-size-xsmall" @click="addAction(trigger)"><icon name="plus"/><span class="is-title">Action</span></button>
				</div>
			</n-collapsible>
		</div>
	</div>
</template>
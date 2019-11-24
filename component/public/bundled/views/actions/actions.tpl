<template id="page-actions">
	<ul class="page-actions" :class="[cell.state.class, {'page-actions-root': actions == null }]" v-auto-close.actions="autoclose"
			v-fixed-header="cell.state.isFixedHeader != null && cell.state.isFixedHeader == true">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Action Settings" v-if="!actions">
						<n-form-combo v-model="cell.state.class" label="Class" 
							:filter="function(value) { return $services.page.classes('page-actions', value) }"/>
						<n-form-text v-model="cell.state.activeClass" label="Active Class"/>
						<n-form-text v-model="cell.state.analysisId" label="Analysis Id"/>
						<n-form-switch v-model="cell.state.useButtons" label="Use Buttons"/>
						<n-form-switch v-model="cell.state.isFixedHeader" label="Fix as header"/>
						<n-form-combo v-model="cell.state.defaultAction" label="Default Action"
							:filter="function() { return cell.state.actions.map(function(x) { return x.name }) }"/>
						<n-form-switch v-model="cell.state.clickBased" label="Use Clicks Instead of Hover"/>
						<n-form-switch v-model="cell.state.showOnlyOne" label="Only allow one open" v-if="cell.state.clickBased"/>
						<n-form-switch v-model="cell.state.leaveOpen" label="Leave Open" v-if="cell.state.clickBased"/>
					</n-collapsible>
					<n-collapsible title="Actions" class="list">
						<div class="list-actions">
							<button @click="addAction(false)">Add Static Action</button>
							<button @click="addAction(true)">Add Dynamic Action</button>
							<button @click="addContent()">Add Content</button>
						</div>
						<n-collapsible class="list-item" :title="action.label ? action.label : action.name" v-for="action in getActions()">
							
							<n-form-section v-if="action.arbitrary">
								<page-configure-arbitrary v-if="action.arbitrary" 
									:page="page"
									:cell="cell"
									:target="action"
									:keys="$services.page.getAvailableParameters(page, cell)"/>
							</n-form-section>
							
							<n-form-section v-else>
								<n-form-text v-model="action.name" label="Name"/>
								<n-form-section v-if="action.dynamic">
									<n-form-combo v-model="action.operation" label="Operation" :filter="getActionOperations"/>
									<n-page-mapper :to="getInputParameters(action)" 
										:from="$services.page.getAvailableParameters(page, cell, true)" 
										v-if="action.operation"
										v-model="action.bindings"/>
									<n-form-combo label="Label" v-if="action.operation" v-model="action.label" :filter="getOperationProperties.bind($self, action)"/>
									<n-form-combo label="Icon" v-if="action.operation" v-model="action.icon" :filter="getOperationProperties.bind($self, action)"/>
									<n-form-switch label="Autotrigger" v-model="action.autotrigger"/>
								</n-form-section>
								<n-form-section v-else>
									<n-form-text v-model="action.label" label="Label"/>
									<n-form-text v-model="action.id" label="Id"/>
									<n-form-text v-model="action.icon" label="Icon"/>
								</n-form-section>
								
								<n-form-combo v-model="action.class" label="Class" :filter="$services.page.classes.bind($self, 'page-action')" />
								<n-form-combo v-model="action.buttonClass" label="Button Class" :filter="$services.page.getSimpleClasses"/>
								
								<n-form-combo v-model="action.event" v-if="false && !action.route && !action.url" label="Event" :filter="function(value) { return value ? [value, '$close'] : ['$close'] }"
									 @input="$emit('updatedEvents')" :timeout="600"/>
									 
								<n-form-switch v-model="action.close" label="Close"/>
								
								<n-form-section v-if="!action.dynamic">
									<div v-if="false">
										<n-form-switch v-model="action.hasFixedState" v-if="action.event" label="Does the event have a fixed value?"/>
										<n-form-combo v-model="action.eventState" v-if="action.event && !action.hasFixedState" label="Event Value"
											:filter="function() { return $services.page.getAvailableKeys(page, cell) }"/>
										<n-form-text v-model="action.eventFixedState" v-if="action.event && action.hasFixedState" label="Event Fixed Value"/>
									</div>
									<n-form-combo v-model="action.route" v-if="(!action.event || !action.event.name) && !action.url" :filter="listRoutes" label="Route"/>
									<n-form-combo v-model="action.anchor" v-if="action.route" label="Anchor" :filter="function(value) { return value ? [value, '$blank', '$window'] : ['$blank', '$window'] }"/>
									<n-form-switch v-model="action.absolute" v-if="action.route && !cell.state.useButtons" label="Absolute"/>
									<n-form-switch v-model="action.mask" label="Mask" v-if="action.route"/>
									<n-form-text v-model="action.url" label="URL" v-if="!action.route && (!action.event || !action.event.name)"/>
									<n-form-combo v-model="action.anchor" v-if="action.url" label="Anchor" :items="['$blank', '$window']"/>
									<n-page-mapper v-if="action.route && $services.router.get(action.route)" :to="$services.page.getRouteParameters($services.router.get(action.route))"
										:from="$services.page.getAvailableParameters(page, cell)" 
										v-model="action.bindings"/>
									<page-event-value :page="page" :container="action" title="Action Event" v-if="!action.dynamic && !action.route && !action.url" name="event" v-bubble.resetEvents/>
									<div class="n-form-component">
										<label class="n-form-label">Disabled if</label>
										<n-ace mode="javascript" v-model="action.disabled"/>
									</div>
									<div class="n-form-component">
										<label class="n-form-label">Show if</label>
										<n-ace mode="javascript" v-model="action.condition"/>
									</div>
									<n-form-combo v-model="action.validate" label="Only if valid" :filter="validatableItems"/>
									<div v-if="action.triggers">
										<div class="list-row" v-for="i in Object.keys(action.triggers)">
											<n-form-combo v-model="action.triggers[i]" label="Trigger" :items="$window.Object.keys($services.page.getAllAvailableParameters(page))"/>
											<button @click="action.triggers.splice(i, 1)"><span class="fa fa-trash"></span></button>
										</div>
										<n-form-switch v-model="action.triggerIfHidden" v-if="action.triggers.length && action.condition" label="Allow trigger if hidden"/>
									</div>
									<div class="list-row" v-for="i in Object.keys(action.activeRoutes)">
										<n-form-combo v-model="action.activeRoutes[i]" label="Active Route" :filter="function(value) { return listRoutes(value, true) }"/>
										<button @click="action.activeRoutes.splice(i, 1)"><span class="fa fa-trash"></span></button>
									</div>
								</n-form-section>
							</n-form-section>
							
							<div class="list-item-actions">
								<button @click="addStyle(action)">Add Style</button>
							</div>
							<div v-if="action.styles">
								<n-form-section class="list-row" v-for="style in action.styles">
									<n-form-text v-model="style.class" label="Class"/>
									<n-form-text v-model="style.condition" label="Condition"/>
									<button @click="action.styles.splice(action.styles.indexOf(style), 1)"><span class="fa fa-trash"></span></button>
								</n-form-section>
							</div>
							
							<div class="list-item-actions">
								<button @click="action.triggers ? action.triggers.push('') : $window.Vue.set(action, 'triggers', [''])">Add Trigger</button>
								<button @click="action.activeRoutes.push('')">Add Active Route</button>
								<button @click="up(action)"><span class="fa fa-chevron-circle-up"></span></button>
								<button @click="down(action)"><span class="fa fa-chevron-circle-down"></span></button>
								<button @click="getActions().splice(getActions().indexOf(action), 1)"><span class="fa fa-trash"></span></button>
							</div>

						</n-collapsible>
					</n-collapsible>
				</n-form-section>
			</n-form>
		</n-sidebar>
		<li v-for="action in (edit ? getActions() : resolvedActions.filter(function(x) { return !x.dynamic}))" v-if="isVisible(action)"
				class="page-action"
				:class="[{ 'has-children': action.actions != null && action.actions.length }, action.class, {'click-based': cell.state.clickBased}]"
				@mouseover="show(action)" @mouseout="hide(action)"
				:sequence="(edit ? getActions() : resolvedActions).indexOf(action) + 1">
			
			<page-arbitrary v-if="action.arbitrary"
				:edit="edit"
				:page="page"
				:cell="cell"
				:target="action"
				:component="$self"/>
			
			<template v-else>
				<span v-if="edit && !action.dynamic" class="fa fa-cog" @click="configureAction(action)"></span>
				<a auto-close-actions class="page-action-link page-action-entry" :href="getActionHref(action)"
					:target="action.anchor == '$blank' ? '_blank' : null"
					:class="getDynamicClasses(action)"
					:sequence="(edit ? getActions() : resolvedActions).indexOf(action) + 1"
					:disabled="isDisabled(action)"
					:id="$services.page.interpret(action.id, $self)"
					@click="handle(action)"
					v-if="!cell.state.useButtons && (action.route || action.event || action.url)"
						><span v-if="action.icon" class="icon fa" :class="action.icon"></span
						><span>{{ $services.page.translate($services.page.interpret(action.label, $self)) }}</span></a>
				<button auto-close-actions class="page-action-button page-action-entry"
					:class="getDynamicClasses(action)"
					:sequence="(edit ? getActions() : resolvedActions).indexOf(action) + 1"
					:disabled="isDisabled(action)"
					:id="$services.page.interpret(action.id, $self)"
					@click="handle(action)" 
					v-else-if="cell.state.useButtons && (action.route || action.event || action.url)"
						><span v-if="action.icon" class="icon fa" :class="action.icon"></span
						><span>{{ $services.page.translate($services.page.interpret(action.label, $self)) }}</span></button>
				<span class="page-action-label page-action-entry" 
					@click="toggle(action)"
					v-else
					:class="getDynamicClasses(action)"
					:sequence="(edit ? getActions() : resolvedActions).indexOf(action) + 1"
						><span v-if="action.icon" class="icon fa" :class="action.icon"></span
						><span>{{ $services.page.translate($services.page.interpret(action.label, $self)) }}</span></span>
				<page-actions :ref="'action_' + (edit ? getActions() : resolvedActions).indexOf(action)"
					v-if="(action.actions && action.actions.length) || configuringAction == action"
					:cell="cell"
					:page="page"
					:parameters="parameters"
					:edit="edit"
					:local-state="localState"
					:actions="action.actions"
					@close="$emit('close')"
					v-show="(edit && false) || showing.indexOf(action) >= 0"/>
			</template>
		</li>
	</ul>
</template>

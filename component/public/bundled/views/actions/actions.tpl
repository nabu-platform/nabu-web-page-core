<template id="page-actions">
	<ul class="page-actions" :class="cell.state.class" v-auto-close.actions="function() { showing.splice(0, showing.length) }">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Action Settings" v-if="!actions">
						<n-form-combo v-model="cell.state.class" label="Class" 
							:filter="function(value) { return $services.page.classes('page-actions', value) }"/>
						<n-form-text v-model="cell.state.activeClass" label="Active Class"/>
						<n-form-switch v-model="cell.state.useButtons" label="Use Buttons"/>
						<n-form-combo v-model="cell.state.defaultAction" label="Default Action"
							:filter="function() { return cell.state.actions.map(function(x) { return x.label }) }"/>
					</n-collapsible>
					<n-collapsible title="Actions" class="list">
						<div class="list-actions">
							<button @click="addAction">Add Action</button>
						</div>
						<n-collapsible class="list-item" :title="action.label" v-for="action in getActions()">
							<n-form-text v-model="action.label" label="Label"/>
							<n-form-text v-model="action.icon" label="Icon"/>
							<n-form-text v-model="action.class" label="Class" />
							<n-form-combo v-model="action.buttonClass" label="Button Class" :filter="$services.page.getSimpleClasses"/>
							<n-form-combo v-model="action.event" v-if="!action.route" label="Event" :filter="function(value) { return value ? [value, '$close'] : ['$close'] }"/>
							<n-form-switch v-model="action.hasFixedState" v-if="action.event" label="Does the event have a fixed value?"/>
							<n-form-combo v-model="action.eventState" v-if="action.event && !action.hasFixedState" label="Event Value"
								:filter="function() { return $services.page.getAvailableKeys(page, cell) }"/>
							<n-form-text v-model="action.eventFixedState" v-if="action.event && action.hasFixedState" label="Event Fixed Value"/>
							<n-form-combo v-model="action.route" v-if="!action.event" :filter="listRoutes" label="Route"/>
							<n-form-text v-model="action.anchor" label="Anchor" v-if="action.route"/>
							<n-form-switch v-model="action.mask" label="Mask" v-if="action.route"/>
							<n-page-mapper v-if="action.route && $services.router.get(action.route)" :to="$services.page.getRouteParameters($services.router.get(action.route))"
								:from="$services.page.getAvailableParameters(page, cell)" 
								v-model="action.bindings"/>
							<div class="n-form-component">
								<label class="n-form-label">Disabled if</label>
								<n-ace mode="javascript" v-model="action.disabled"/>
							</div>
							<div class="n-form-component">
								<label class="n-form-label">Show if</label>
								<n-ace mode="javascript" v-model="action.condition"/>
							</div>
							<div class="list-row" v-for="i in Object.keys(action.activeRoutes)">
								<n-form-combo v-model="action.activeRoutes[i]" label="Active Route" :filter="function(value) { return listRoutes(value, true) }"/>
								<button @click="action.activeRoutes.splice(i, 1)"><span class="fa fa-trash"></span></button>
							</div>
							<div class="list-item-actions">
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
		<li v-for="action in getActions()" v-if="isVisible(action)"
				class="page-action"
				:class="[{ 'has-children': action.actions.length }, action.class]"
				@mouseover="show(action)" @mouseout="hide(action)"
				:sequence="getActions().indexOf(action) + 1">
			<span v-if="edit" class="fa fa-cog" @click="configureAction(action)"></span>
			<a auto-close-actions class="page-action-link page-action-entry" href="javascript:void(0)"
				:class="getDynamicClasses(action)"
				:sequence="getActions().indexOf(action) + 1"
				:disabled="isDisabled(action)"
				@click="handle(action)" 
				v-if="!cell.state.useButtons && (action.route || action.event)"
					><span v-if="action.icon" class="icon fa" :class="action.icon"></span
					><span>{{ $services.page.interpret(action.label, $self) }}</span></a>
			<button auto-close-actions class="page-action-button page-action-entry"
				:class="getDynamicClasses(action)"
				:sequence="getActions().indexOf(action) + 1"
				:disabled="isDisabled(action)"
				@click="handle(action)" 
				v-else-if="cell.state.useButtons && (action.route || action.event)"
					><span v-if="action.icon" class="icon fa" :class="action.icon"></span
					><span>{{ $services.page.interpret(action.label, $self) }}</span></button>
			<span class="page-action-label page-action-entry" 
				v-else
				:class="getDynamicClasses(action)"
				:sequence="getActions().indexOf(action) + 1"
					><span v-if="action.icon" class="icon fa" :class="action.icon"></span
					><span>{{ $services.page.interpret(action.label, $self) }}</span></span>
			<page-actions :ref="'action_' + getActions().indexOf(action)"
				v-if="(action.actions && action.actions.length) || configuringAction == action"
				:cell="cell"
				:page="page"
				:parameters="parameters"
				:edit="edit"
				:local-state="localState"
				:actions="action.actions"
				@close="$emit('close')"
				v-show="edit || showing.indexOf(action) >= 0"/>
		</li>
	</ul>
</template>

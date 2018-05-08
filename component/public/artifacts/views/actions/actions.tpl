<template id="page-actions">
	<ul class="page-actions" :class="cell.state.class" v-auto-close.actions="function() { showing.splice(0, showing.length) }">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Action Settings" v-if="!actions">
						<n-form-combo v-model="cell.state.class" label="Class" 
							:filter="function(value) { return $services.page.classes('page-actions').filter(function(x) { return !value || x.toLowerCase().indexOf(x.toLowerCase()) >= 0 }) }"/>
					</n-collapsible>
					<n-collapsible title="Actions" class="list">
						<div class="list-actions">
							<button @click="addAction">Add Action</button>
						</div>
						<n-collapsible class="list-item" :title="action.label" v-for="action in getActions()">
							<n-form-text v-model="action.label" label="Label"/>
							<n-form-text v-model="action.icon" label="Icon"/>
							<n-form-combo v-model="action.class" label="Class" :filter="$services.page.getSimpleClasses"/>
							<n-form-text v-model="action.event" v-if="!action.route" label="Event"/>
							<n-form-combo v-model="action.eventState" v-if="action.event" label="Event State"
								:filter="function() { return Object.keys($services.page.getAvailableParameters(page, cell)) }"/>
							<n-form-combo v-model="action.route" v-if="!action.event" :filter="listRoutes" label="Route"/>
							<n-form-text v-model="action.anchor" label="Anchor" v-if="action.route"/>
							<n-form-switch v-model="action.mask" label="Mask" v-if="action.route"/>
							<n-page-mapper v-if="action.route && $services.router.get(action.route)" :to="$services.page.getRouteParameters($services.router.get(action.route))"
								:from="$services.page.getAvailableParameters(page, cell)" 
								v-model="action.bindings"/>
							<div class="n-form-component">
								<label class="n-form-label">Condition</label>
								<n-ace mode="javascript" v-model="action.condition"/>
							</div>
							<div class="list-item-actions">
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
				@mouseover="show(action)" @mouseout="hide(action)">
			<span v-if="edit" class="fa fa-cog" @click="configureAction(action)"></span>
			<span v-if="action.icon" class="icon fa" :class="'fa-' + action.icon" @click="handle(action)"></span>
			<a auto-close-actions class="page-action-link page-action-entry" href="javascript:void(0)" 
				@click="handle(action)" v-if="action.route || action.event">{{ action.label }}</a>
			<span class="page-action-entry" v-else>{{ action.label }}</span>
			<page-actions :ref="'action_' + getActions().indexOf(action)"
				:cell="cell"
				:page="page"
				:parameters="parameters"
				:edit="edit"
				:local-state="localState"
				:actions="action.actions" 
				v-show="edit || showing.indexOf(action) >= 0"/>
		</li>
	</ul>
</template>

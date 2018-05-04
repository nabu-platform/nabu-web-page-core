<template id="page-tabs">
	<ul class="page-tabs" :class="cell.state.class" v-auto-close.tabs="function() { showing.splice(0, showing.length) }">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Tab Settings" v-if="!actions">
						<n-form-combo v-model="cell.state.class" label="Class" 
							:filter="function(value) { return $services.page.classes('page-tabs').filter(function(x) { return !value || x.toLowerCase().indexOf(x.toLowerCase()) >= 0 }) }"/>
					</n-collapsible>
					<n-collapsible title="Actions" class="list">
						<div class="list-actions">
							<button @click="addAction">Add Action</button>
						</div>
						<n-collapsible class="list-item" :title="action.label" v-for="action in getActions()">
							<n-form-text v-model="action.label" label="Label"/>
							<n-form-text v-model="action.event" v-if="!action.route" label="Event"/>
							<n-form-combo v-model="action.route" v-if="!action.event" :filter="listRoutes" label="Route"/>
							<n-form-text v-model="action.anchor" label="Anchor" v-if="action.route"/>
							<n-form-switch v-model="action.mask" label="Mask" v-if="action.route"/>
							<n-page-mapper v-if="action.route" :to="$services.page.getRouteParameters($services.router.get(action.route))"
								:from="$services.page.getAvailableParameters(page, cell)" 
								v-model="action.bindings"/>
							<n-ace mode="javascript" v-model="action.condition"/>
						</n-collapsible>
					</n-collapsible>
				</n-form-section>
			</n-form>
		</n-sidebar>
		<li v-for="action in getActions()" v-if="isVisible(action)" 
				:class="{ 'has-children': action.actions.length }" 
				@mouseover="show(action)" @mouseout="hide(action)">
			<span v-if="edit" class="n-icon n-icon-cog" @click="configureAction(action)"></span>
			<a auto-close-tabs class="page-tab-action page-tab-entry" href="javascript:void(0)" 
				@click="handle(action)" v-if="action.route || action.event">{{ action.label }}</a>
			<span class="page-tab-entry" v-else>{{ action.label }}</span>
			<page-tabs :ref="'action_' + getActions().indexOf(action)"
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

<template id="nabu-page">
	<component :is="pageTag()" :inline-all="true" class="page" :class="classes" :page="page.name" @drop="dropMenu($event)" @dragover="$event.preventDefault()">
		<div class="page-menu n-page-menu" v-if="edit">
			<button @click="configuring = !configuring"><span class="fa fa-cog" title="Configure"></span></button>
			<button @click="addRow(page.content)"><span class="fa fa-plus" title="Add Row"></span></button>
			<button v-if="!embedded" @click="$services.page.update(page)"><span class="fa fa-save" title="Save"></span></button>
			<button @click="pasteRow" v-if="$services.page.copiedRow"><span class="fa fa-paste"></span></button>
			<button v-if="!embedded" @click="edit = false"><span class="fa fa-sign-out-alt" title="Stop Editing"></span></button>
		</div>
		<div class="page-edit" v-else-if="$services.page.canEdit() && $services.page.wantEdit && !embedded" :draggable="true" 
				@dragstart="dragMenu($event)"
				:style="{'top': page.content.menuY ? page.content.menuY + 'px' : '0px', 'left': page.content.menuX ? page.content.menuX + 'px' : '0px'}">
			<span>{{page.name}}</span>
			<span class="fa fa-cog" v-if="hasConfigureListener()" @click="triggerConfiguration()"/>
			<span class="fa fa-pencil-alt" @click="edit = !edit"></span>
			<span class="fa fa-copy" v-route:pages></span>
			<span class="n-icon" :class="'n-icon-' + $services.page.cssStep" v-if="false && $services.page.cssStep"></span>
			<span v-if="$services.language && $services.language.available.length" class="language-selector">
				<span class="current">{{hasLanguageSet() ? $services.language.current.name : "none"}}</span>
				<div class="options">
					<span v-for="language in $services.language.available" @click="$services.language.current = language">{{language.name}}</span>
					<span v-if="$services.language.current && ${environment('development')}" @click="$services.language.current = null">unset</span>
				</div>
			</span>
			<span class="fa fa-sign-out-alt" v-route:logout></span>
		</div>
		<div class="page-edit" v-else-if="false && !$services.page.canEdit() && !embedded && $services.page.wantEdit && $services.user && !$services.user.loggedIn"
				:style="{'top': '0px', 'left': '0px'}">
			<span>Login</span>
			<span class="fa fa-sign-in-alt" v-route:login></span>
		</div>
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-collapsible title="Page Settings">
					<n-form-text v-model="page.content.category" label="Category" />
					<n-form-text v-model="page.content.path" label="Path"/>
					<n-form-text v-model="page.content.class" label="Class"/>
					<n-form-switch label="Is slow" v-if="!page.content.initial" v-model="page.content.slow"/>
					<n-form-combo label="Page Type" :items="['page', 'email']" v-model="page.content.pageType"/>
					<n-form-combo label="Page Parent" :filter="filterRoutes" v-model="page.content.pageParent"/>
					<n-form-text v-model="page.content.defaultAnchor" label="Default Content Anchor"/>
					
					<div class="list" v-if="page.content.roles">
						<div v-for="i in Object.keys(page.content.roles)" class="list-row">
							<n-form-text v-model="page.content.roles[i]"/>
							<button @click="page.content.roles.splice(i)"><span class="fa fa-trash"></span></button>
						</div>
					</div>
					<button @click="page.content.roles ? page.content.roles.push('') : $window.Vue.set(page.content, 'roles', [''])">Add Role</button>
				</n-collapsible>
				<n-collapsible title="Initial State" class="list">
					<div class="list-actions">
						<button @click="addState">Add State</button>
					</div>
					<n-collapsible class="list-item" :title="state.name" v-for="state in page.content.states">
						<n-form-text :value="state.name" @input="function(newValue) { if (!validateStateName(newValue).length) state.name = newValue; }" label="Name" :required="true" :validator="validateStateName"/>
						<n-form-combo :value="state.operation" :filter="getStateOperations" label="Operation" @input="function(newValue) { setStateOperation(state, newValue) }"/>
						<n-page-mapper v-if="state.operation && Object.keys($services.page.getPageParameters(page)).length" :to="getOperationParameters(state.operation)"
							:from="{page:$services.page.getPageParameters(page)}" 
							v-model="state.bindings"/>
						<div class="list-item-actions">
							<button @click="page.content.states.splice(page.content.states.indexOf(state), 1)"><span class="fa fa-trash"></span></button>
						</div>
						<div class="list" v-if="state.refreshOn">
							<div v-for="i in Object.keys(state.refreshOn)" class="list-row">
								<n-form-combo v-model="state.refreshOn[i]" :filter="getAvailableEvents" placeholder="event"/>
								<button @click="state.refreshOn.splice(i)"><span class="fa fa-trash"></span></button>
							</div>
						</div>
						<button @click="state.refreshOn ? state.refreshOn.push('') : $window.Vue.set(state, 'refreshOn', [''])">Add Refresh Event</button>
					</n-collapsible>
				</n-collapsible>
				<n-collapsible title="Query Parameters">
					<div class="list-actions">
						<button @click="page.content.query.push('unnamed')">Add Query Parameter</button>
					</div>
					<n-form-section class="list-row" v-for="i in Object.keys(page.content.query)">
						<n-form-text v-model="page.content.query[i]"/>
						<button @click="removeQuery(i)"><span class="fa fa-trash"></span></button>
					</n-form-section>
				</n-collapsible>
				<n-collapsible title="Page Parameters" class="list">
					<div class="list-actions">
						<button @click="addPageParameter">Add Page Parameter</button>
					</div>
					<n-collapsible class="list-item" v-for="parameter in page.content.parameters" :title="parameter.name">
						<n-form-text v-model="parameter.name" :required="true" label="Name"/>
						<n-form-combo v-model="parameter.type" label="Type" :nillable="false" :filter="getParameterTypes"/>
						<n-form-combo v-model="parameter.format" label="Format" v-if="parameter.type == 'string'" :items="['date-time', 'uuid', 'uri', 'date', 'password']"/>
						<n-form-text v-model="parameter.default" label="Default Value"/>
						<n-form-switch v-model="parameter.global" label="Is translation global?"/>
						<div class="list-row" v-for="i in Object.keys(parameter.listeners)">
							<n-form-combo v-model="parameter.listeners[i]" :filter="function() { return $services.page.getAllAvailableKeys(page) }"/>
							<button @click="parameter.listeners.splice(i, 1)"><span class="fa fa-trash"></span></button>
						</div>
						<div class="list-item-actions">
							<button @click="parameter.listeners.push('')">Add Listener</button>
							<button @click="page.content.parameters.splice(page.content.parameters.indexOf(parameter), 1)"><span class="fa fa-trash"></span></button>	
						</div>
					</n-collapsible>
				</n-collapsible>
				<n-collapsible title="Actions" class="list">
					<div class="list-actions">
						<button @click="addAction">Add Action</button>
					</div>
					<n-collapsible class="list-item" :title="action.name" v-for="action in page.content.actions">
						<n-form-text v-model="action.name" label="Name" :required="true"/>
						<n-form-text v-model="action.confirmation" label="Confirmation Message"/>
						<n-form-combo v-model="action.on" label="Trigger On" :filter="getAvailableEvents"/>
						<n-form-text v-model="action.scroll" label="Scroll to" v-if="!action.operation"/>
						<n-form-combo v-model="action.route" v-if="!action.operation && !action.url" label="Redirect" :filter="filterRoutes"/>
						<n-form-combo v-model="action.anchor" v-if="action.route || (action.operation && isGet(action.operation))" label="Anchor" :filter="function(value) { return value ? [value, '$blank', '$window'] : ['$blank', '$window'] }"/>
						<n-form-combo v-model="action.operation" v-if="!action.route && !action.scroll && !action.url" label="Operation" :filter="getOperations" />
						<n-form-text v-model="action.url" label="URL" v-if="!action.route && !action.operation && !action.scroll"/>
						<n-form-switch v-if="action.operation" v-model="action.isSlow" label="Is slow operation?"/>
						<n-form-text v-if="action.operation" v-model="action.event" label="Success Event" :timeout="600" @input="resetEvents()"/>
						<n-form-switch v-if="action.operation" v-model="action.expandBindings" label="Field level bindings"/>
						<div class="list-row">
							<n-form-combo v-if="action.operation && !action.route && action.expandBindings" 
								:items="Object.keys(availableParameters)" v-model="autoMapFrom"/>
							<button @click="automap(action)" :disabled="!autoMapFrom">Automap</button>
						</div>
						<n-page-mapper v-if="action.operation && !action.route && !action.expandBindings" :to="getOperationParameters(action.operation)"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<n-page-mapper v-else-if="action.operation && !action.route && action.expandBindings" :to="getOperationParameters(action.operation, true)"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<n-page-mapper v-if="action.route" :to="$services.page.getRouteParameters($services.router.get(action.route))"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<div class="list-item-actions">
							<button @click="page.content.actions.splice(page.content.actions.indexOf(action), 1)"><span class="fa fa-trash"></span></button>
						</div>
						
						<div v-if="action.eventResets">
							<div class="list-row" v-for="i in Object.keys(action.eventResets)">
								<n-form-combo v-model="action.eventResets[i]" :filter="getAvailableEvents"/>
								<button @click="action.eventResets.splice(i, 1)"><span class="fa fa-trash"></span></button>
							</div>
						</div>
						<div class="list-item-actions">
							<button @click="addEventReset(action)">Add Event Reset</button>
						</div>
					</n-collapsible>
				</n-collapsible>
				<n-collapsible title="Publish Global Events" class="list">
					<div class="list-actions">
						<button @click="addGlobalEvent">Add Global Event</button>
					</div>
					<n-form-section v-if="page.content.globalEvents">
						<n-form-section class="list-row" v-for="i in Object.keys(page.content.globalEvents)">
							<n-form-combo v-model="page.content.globalEvents[i].localName"
								label="Local Name"
								:filter="getAvailableEvents"/>
							<n-form-text v-model="page.content.globalEvents[i].globalName" 
								label="Global Name"
								:placeholder="page.content.globalEvents[i].localName"/>
							<button @click="page.content.globalEvents.splice(i, 1)"><span class="fa fa-trash"></span></button>
						</n-form-section>
					</n-form-section>
				</n-collapsible>
				<n-collapsible title="Subscribe Global Events" class="list">
					<div class="list-actions">
						<button @click="addGlobalEventSubscription">Add Global Event</button>
					</div>
					<n-form-section v-if="page.content.globalEventSubscriptions">
						<n-form-section class="list-row" v-for="i in Object.keys(page.content.globalEventSubscriptions)">
							<n-form-combo v-model="page.content.globalEventSubscriptions[i].globalName"
								label="Global Name"
								:items="$window.Object.keys($services.page.getGlobalEvents())"/>
							<n-form-text v-model="page.content.globalEventSubscriptions[i].localName" 
								label="Local Name"
								:placeholder="page.content.globalEventSubscriptions[i].globalName"/>
							<button @click="page.content.globalEventSubscriptions.splice(i, 1)"><span class="fa fa-trash"></span></button>
						</n-form-section>
					</n-form-section>
				</n-collapsible>
				<component v-for="plugin in plugins" :is="plugin.configure" 
					:page="page" 
					:edit="edit"/>
			</n-form>
		</n-sidebar>
		<n-page-rows :rows="page.content.rows" v-if="page.content.rows" :page="page" :edit="edit"
			:parameters="parameters"
			:events="events"
			:ref="page.name + '_rows'"
			:root="true"
			:page-instance-id="pageInstanceId"
			:stop-rerender="stopRerender"
			@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { page.content.rows.splice(page.content.rows.indexOf(row), 1) }) }"/>
	</component>
</template>

<template id="page-rows">
	<div class="page-rows">
		<component :is="rowTagFor(row)" v-for="row in getCalculatedRows()" class="page-row" :id="page.name + '_' + row.id" 
				:class="['page-row-' + row.cells.length, row.class ? row.class : null ]" 
				:key="'page_' + pageInstanceId + '_row_' + row.id"
				:row-key="'page_' + pageInstanceId + '_row_' + row.id"
				v-if="edit || shouldRenderRow(row)"
				:style="rowStyles(row)"
				v-bind="getRendererProperties(row)">
			<div v-if="(edit || $services.page.wantEdit) && row.name && !row.collapsed" :style="getRowEditStyle(row)" class="row-edit-label"
				:class="'direction-' + (row.direction ? row.direction : 'horizontal')"><span>{{row.name}}</span></div>
			<div class="page-row-menu n-page-menu" v-if="edit">
				<label v-if="row.collapsed">{{row.name}}</label>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="configuring = row.id"><span class="fa fa-cog"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="up(row)"><span class="fa fa-chevron-circle-up"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="down(row)"><span class="fa fa-chevron-circle-down"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="addCell(row)"><span class="fa fa-plus" title="Add Cell"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="copyRow(row)"><span class="fa fa-copy" title="Copy Row"></span></button>
				<button v-if="!row.collapsed && $services.page.copiedCell" :style="rowButtonStyle(row)" @click="pasteCell(row)"><span class="fa fa-paste" title="Paste Cell"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="$emit('removeRow', row)"><span class="fa fa-times" title="Remove Row"></span></button>
				<button :style="rowButtonStyle(row)" @click="row.collapsed = !row.collapsed"><span class="fa" :class="{'fa-minus-square': !row.collapsed, 'fa-plus-square': row.collapsed }"></span></button>
			</div>
			<div v-if="row.customId" class="custom-row custom-id" :id="row.customId"><!-- to render stuff in without disrupting the other elements here --></div>
			<component :is="cellTagFor(row, cell)" :style="getStyles(cell)" v-for="cell in getCalculatedCells(row)" v-if="shouldRenderCell(row, cell)" 
					:id="page.name + '_' + row.id + '_' + cell.id" 
					:class="[{'clickable': !!cell.clickEvent}, {'page-cell': edit || !cell.target || cell.target == 'page', 'page-prompt': cell.target == 'prompt' || cell.target == 'sidebar'}, cell.class ? cell.class : null, {'has-page': hasPageRoute(cell), 'is-root': root} ]" 
					:key="'page_' + pageInstanceId + '_cell_' + cell.id"
					:cell-key="'page_' + pageInstanceId + '_cell_' + cell.id"
					@click="clickOnCell(cell)"
					v-bind="getRendererProperties(cell)">
				<div v-if="(edit || $services.page.wantEdit) && cell.name" :style="getCellEditStyle(cell)" class="cell-edit-label"><span>{{cell.name}}</span></div>
				<div v-if="cell.customId" class="custom-cell custom-id" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
				<n-sidebar v-if="configuring == cell.id" @close="configuring = null" class="settings" key="cell-settings">
					<n-form class="layout2" key="cell-form">
						<n-form-section>
							<n-collapsible title="Content" key="cell-content">
								<n-form-combo label="Content Route" :filter="filterRoutes" v-model="cell.alias"
									:key="'page_' + pageInstanceId + '_' + cell.id + '_alias'"
									:required="true"/>
								<n-page-mapper v-if="cell.alias" 
									:key="'page_' + pageInstanceId + '_' + cell.id + '_mapper'"
									:to="getRouteParameters(cell)"
									:from="getAvailableParameters(cell)" 
									v-model="cell.bindings"/>
							</n-collapsible>
							<n-collapsible title="Repeat" class="list" v-if="cell.instances && $services.page.getAllArrays(page, cell.id).length">
								<div class="list-actions" v-if="!Object.keys(cell.instances).length">
									<button @click="addInstance(cell)">Add Repeat</button>
								</div>
								<n-collapsible class="list-item" :title="key" v-for="key in Object.keys(cell.instances)">
									<n-form-text :value="key" label="Name" :required="true" :timeout="600" @input="function(value) { renameInstance(cell, key, value) }"/>
									<n-form-combo v-model="cell.instances[key]" label="Array" :filter="function() { return $services.page.getAllArrays(page, cell.id) }" />
									<div class="list-item-actions">
										<button @click="removeInstance(cell, key)"><span class="fa fa-trash"></span></button>
									</div>
								</n-collapsible>
							</n-collapsible>
							<n-collapsible title="Cell Settings" key="cell-settings">
								<n-form-text label="Cell Id" v-model="cell.customId"/>
								<n-form-text label="Cell Name" v-model="cell.name"/>
								<n-form-text label="Cell Width (flex or other)" v-model="cell.width"/>
								<n-form-text label="Cell Height (any)" v-model="cell.height"/>
								<n-form-text label="Click Event" v-model="cell.clickEvent" :timeout="600" @input="resetEvents"/>
								<n-form-text label="Cell Reference" v-model="cell.ref"/>
								<n-form-text label="Class" v-model="cell.class"/>
								<n-form-combo label="Cell Renderer" v-model="cell.renderer" :items="getRenderers('cell')" :formatter="function(x) { return x.name }" :extracter="function(x) { return x.name }"/>
								<n-form-section v-if="cell.renderer">
									<n-form-text v-for="property in getRendererPropertyKeys(cell)" :label="property" v-model="cell.rendererProperties[property]"/>
								</n-form-section>
								<n-form-switch label="Stop Rerender" v-model="cell.stopRerender"/>
								<n-form-text label="Condition" v-model="cell.condition"/>
								<div class="list-actions">
									<button @click="addDevice(cell)">Add device rule</button>
								</div>
								<div v-if="cell.devices">
									<div class="list-row" v-for="device in cell.devices">
										<n-form-combo v-model="device.operator" :items="['>', '>=', '<', '<=', '==']"/>
										<n-form-combo v-model="device.name" 
											:filter="suggestDevices"/>
										<button @click="cell.devices.splice(cell.devices.indexOf(device), 1)"><span class="fa fa-trash"></span></button>
									</div>
								</div>
							</n-collapsible>
							<n-collapsible title="Eventing" key="cell-events">
								<n-form-switch label="Closeable" v-model="cell.closeable" v-if="!cell.on"/>
								<n-form-combo label="Show On" v-model="cell.on" :filter="getAvailableEvents" v-if="!cell.closeable"/>
								<n-form-combo label="Target" v-if="cell.on" :items="['page', 'sidebar', 'prompt']" v-model="cell.target"/>
								<n-form-switch label="Prevent Auto Close" v-model="cell.preventAutoClose" v-if="cell.target == 'sidebar'"/>
							</n-collapsible>
						</n-form-section>
					</n-form>
				</n-sidebar>
				<div class="page-cell-menu n-page-menu" v-if="edit">
					<button @click="configuring = cell.id"><span class="fa fa-magic" title="Set Cell Content"></span></button
					><button @click="configure(cell)" v-if="cell.alias"><span class="fa fa-cog" title="Configure Cell Content"></span></button
					><button @click="left(row, cell)" v-if="row.cells.length >= 2"><span class="fa fa-chevron-circle-left"></span></button
					><button @click="right(row, cell)" v-if="row.cells.length >= 2"><span class="fa fa-chevron-circle-right"></span></button
					><button @click="cellUp(row, cell)" v-if="false"><span class="fa fa-chevron-circle-up"></span></button
					><button @click="cellDown(row, cell)" v-if="false"><span class="fa fa-chevron-circle-down"></span></button
					><button @click="addRow(cell)"><span class="fa fa-plus" title="Add Row"></span></button
					><button @click="removeCell(row.cells, cell)"><span class="fa fa-times" title="Remove Cell"></span></button
					><button @click="copyCell(cell)"><span class="fa fa-copy" title="Copy Cell"></span></button
					><button @click="pasteRow(cell)" v-if="$services.page.copiedRow"><span class="fa fa-paste" title="Paste Row"></span></button>
				</div>
				
				<div v-if="edit">
					<div v-if="cell.alias" :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return false } }"></div>
					<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
						:parameters="parameters"
						:events="events"
						:ref="page.name + '_' + cell.id + '_rows'"
						:local-state="getLocalState(row, cell)"
						:page-instance-id="pageInstanceId"
						:stop-rerender="stopRerender"
						@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
				</div>
				<template v-else-if="shouldRenderCell(row, cell)">
					<n-sidebar v-if="cell.target == 'sidebar'" @close="close(cell)" :popout="false" :autocloseable="!cell.preventAutoClose" class="content-sidebar">
						<div @keyup.esc="close(cell)" :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-if="cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return !stopRerender && !cell.stopRerender } }"></div>
						<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
							:parameters="parameters"
							:events="events"
							:ref="page.name + '_' + cell.id + '_rows'"
							:local-state="getLocalState(row, cell)"
							:page-instance-id="pageInstanceId"
							:stop-rerender="stopRerender"
							@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
					</n-sidebar>
					<n-prompt v-else-if="cell.target == 'prompt'" @close="close(cell)">
						<div @keyup.esc="close(cell)" :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-if="cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return !stopRerender && !cell.stopRerender } }"></div>
						<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
							:parameters="parameters"
							:events="events"
							:ref="page.name + '_' + cell.id + '_rows'"
							:local-state="getLocalState(row, cell)"
							:page-instance-id="pageInstanceId"
							:stop-rerender="stopRerender"
							@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
					</n-prompt>
					<template v-else>
						<div :key="'page_' + pageInstanceId + '_rendered_' + cell.id" v-if="cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return !stopRerender && !cell.stopRerender } }"></div>
						<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
							:parameters="parameters"
							:events="events"
							:ref="page.name + '_' + cell.id + '_rows'"
							:local-state="getLocalState(row, cell)"
							:page-instance-id="pageInstanceId"
							:stop-rerender="stopRerender"
							@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
					</template>
				</template>
			</component>
			<n-sidebar v-if="configuring == row.id" @close="configuring = null" class="settings">
				<n-form class="layout2">
					<n-collapsible title="Row Settings">
						<n-form-text label="Row Id" v-model="row.customId"/>
						<n-form-text label="Row Name" v-model="row.name"/>
						<n-form-combo label="Show On" v-model="row.on" :filter="getAvailableEvents"/>
						<n-form-text label="Class" v-model="row.class"/>
						<n-form-combo label="Row Renderer" v-model="row.renderer" :items="getRenderers('row')"  :formatter="function(x) { return x.name }" :extracter="function(x) { return x.name }"/>
						<n-form-section v-if="row.renderer">
							<n-form-text v-for="property in getRendererPropertyKeys(row)" :label="property" v-model="row.rendererProperties[property]"/>
						</n-form-section>
						<n-form-text label="Condition" v-model="row.condition"/>
						<n-form-combo label="Direction" v-model="row.direction" :items="['horizontal', 'vertical']"/>
						<n-form-combo label="Alignment" v-model="row.align" :items="['center', 'flex-start', 'flex-end', 'stretch', 'baseline']"/>
						<n-form-combo label="Justification" v-model="row.justify" :items="['center', 'flex-start', 'flex-end', 'space-between', 'space-around', 'space-evenly']"/>
						<div class="list-actions">
							<button @click="addDevice(row)">Add device rule</button>
						</div>
						<div v-if="row.devices">
							<div class="list-row" v-for="device in row.devices">
								<n-form-combo v-model="device.operator" :items="['>', '>=', '<', '<=', '==']"/>
								<n-form-combo v-model="device.name" 
									:filter="suggestDevices"/>
								<button @click="row.devices.splice(row.devices.indexOf(device), 1)"><span class="fa fa-trash"></span></button>
							</div>
						</div>
					</n-collapsible>
					<n-collapsible title="Repeat" class="list" v-if="row.instances && $services.page.getAllArrays(page, row.id).length">
						<div class="list-actions" v-if="!Object.keys(row.instances).length">
							<button @click="addInstance(row)">Add Repeat</button>
						</div>
						<n-collapsible class="list-item" :title="key" v-for="key in Object.keys(row.instances)">
							<n-form-text :value="key" label="Name" :required="true" :timeout="600" @input="function(value) { renameInstance(row, key, value) }"/>
							<n-form-combo v-model="row.instances[key]" label="Array" :filter="function() { return $services.page.getAllArrays(page, row.id) }" />
							<div class="list-item-actions">
								<button @click="removeInstance(row, key)"><span class="fa fa-trash"></span></button>
							</div>
						</n-collapsible>
					</n-collapsible>
				</n-form>
			</n-sidebar>
		</component>
	</div>
</template>

<template id="n-prompt">
	<div class="n-prompt">
		<div class="n-prompt-content">
			<slot></slot>
		</div>
	</div>
</template>
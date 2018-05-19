<template id="page">
	<div class="page" :class="classes" :page="page.name" @drop="dropMenu($event)" @dragover="$event.preventDefault()">
		<div class="page-menu" v-if="edit">
			<button @click="configuring = !configuring"><span class="fa fa-cog" title="Configure"></span></button>
			<button @click="addRow(page.content)"><span class="fa fa-plus" title="Add Row"></span></button>
			<button @click="$services.page.update(page)"><span class="fa fa-save" title="Save"></span></button>
			<button @click="edit = false"><span class="fa fa-sign-out-alt" title="Stop Editing"></span></button>
		</div>
		<div class="page-edit" v-else-if="$services.page.canEdit()" :draggable="true" 
				@dragstart="dragMenu($event)"
				:style="{'top': page.content.menuY ? page.content.menuY + 'px' : '0px', 'left': page.content.menuX ? page.content.menuX + 'px' : '0px'}">
			<span>{{page.name}}</span>
			<span class="fa fa-pencil-alt" @click="edit = !edit"></span>
			<span class="fa fa-copy" v-route:pages></span>
			<span class="n-icon" :class="'n-icon-' + $services.page.cssStep" v-if="false && $services.page.cssStep"></span>
		</div>
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-collapsible title="Page Settings">
					<n-form-text v-model="page.content.category" label="Category" />
					<n-form-text v-model="page.content.path" label="Path"/>
					<n-form-text v-model="page.content.class" label="Class"/>
					<n-form-switch label="Is slow" v-if="!page.content.initial" v-model="page.content.slow"/>
				</n-collapsible>
				<n-collapsible title="Initial State" class="list">
					<div class="list-actions">
						<button @click="addState">Add State</button>
					</div>
					<n-collapsible class="list-item" :title="state.name" v-for="state in page.content.states">
						<n-form-text v-model="state.name" label="Name" :required="true"/>
						<n-form-combo :value="state.operation" :filter="getStateOperations" label="Operation" @input="function(newValue) { setStateOperation(state, newValue) }"/>
						<n-page-mapper v-if="state.operation && Object.keys($services.page.getPageParameters(page)).length" :to="getOperationParameters(state.operation)"
							:from="{page:$services.page.getPageParameters(page)}" 
							v-model="state.bindings"/>
						<div class="list-item-actions">
							<button @click="page.content.states.splice(page.content.states.indexOf(state), 1)"><span class="fa fa-trash"></span></button>
						</div>
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
						<n-form-combo v-model="parameter.type" label="Type" :nillable="false" :items="['string', 'boolean', 'number', 'integer']"/>
						<n-form-combo v-model="parameter.format" label="Format" v-if="parameter.type == 'string'" :items="['date-time', 'uuid', 'uri', 'date', 'password']"/>
						<n-form-text v-model="parameter.default" label="Default Value"/>
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
						<n-form-combo v-model="action.route" v-if="!action.operation" label="Redirect" :filter="filterRoutes"/>
						<n-form-combo v-model="action.anchor" v-if="action.route" label="Anchor" :filter="function(value) { return value ? [value, '$blank', '$window'] : ['$blank', '$window'] }"/>
						<n-form-combo v-model="action.operation" v-if="!action.route" label="Operation" :filter="getOperations" />
						<n-page-mapper v-if="action.operation && !action.route" :to="getOperationParameters(action.operation)"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<n-page-mapper v-if="action.route" :to="$services.page.getRouteParameters($services.router.get(action.route))"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<div class="list-item-actions">
							<button @click="page.content.actions.splice(page.content.actions.indexOf(action), 1)"><span class="fa fa-trash"></span></button>
						</div>
					</n-collapsible>
				</n-collapsible>
			</n-form>
		</n-sidebar>
		<n-page-rows :rows="page.content.rows" v-if="page.content.rows" :page="page" :edit="edit"
			:parameters="parameters"
			:events="events"
			:ref="page.name + '_rows'"
			@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { page.content.rows.splice(page.content.rows.indexOf(row), 1) }) }"/>
	</div>
</template>

<template id="page-rows">
	<div class="page-rows">
		<div v-for="row in getCalculatedRows()" class="page-row" :id="page.name + '_' + row.id" :class="['page-row-' + row.cells.length, row.class ? row.class : null ]" :key="row.id"
				v-if="edit || shouldRenderRow(row)"
				:style="rowStyles(row)">
			<div v-if="row.customId" class="custom-row custom-id" :id="row.customId"><!-- to render stuff in without disrupting the other elements here --></div>
			<div :style="getStyles(cell)" v-for="cell in getCalculatedCells(row)" v-if="shouldRenderCell(row, cell) || cell.rows.length" :id="page.name + '_' + row.id + '_' + cell.id" :class="[{'page-cell': edit || !cell.target || cell.target == 'page'}, cell.class ? cell.class : null, {'has-page': hasPageRoute(cell)} ]" :key="cell.id">
				<div v-if="cell.customId" class="custom-cell custom-id" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
				<n-sidebar v-if="configuring == cell.id" @close="configuring = null" class="settings" key="cell-settings">
					<n-form class="layout2" key="cell-form">
						<n-form-section>
							<n-collapsible title="Content" key="cell-content">
								<n-form-combo label="Content Route" :filter="filterRoutes" v-model="cell.alias"
									:key="cell.id + '_alias'"
									:required="true"/>
								<n-page-mapper v-if="cell.alias" 
									:key="cell.id + '_mapper'"
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
								<n-form-text label="Cell Width (flex)" v-model="cell.width"/>
								<n-form-text label="Cell Height (any)" v-model="cell.height"/>
								<n-form-text label="Class" v-model="cell.class"/>
								<n-form-text label="Condition" v-model="cell.condition"/>
							</n-collapsible>
							<n-collapsible title="Eventing" key="cell-events">
								<n-form-combo label="Show On" v-model="cell.on" :filter="getAvailableEvents"/>
								<n-form-combo label="Target" v-if="cell.on" :items="['page', 'sidebar', 'prompt']" v-model="cell.target"/>
							</n-collapsible>
						</n-form-section>
					</n-form>
				</n-sidebar>
				<div class="page-cell-menu n-page-menu" v-if="edit">
					<button @click="configuring = cell.id"><span class="fa fa-magic" title="Set Cell Content"></span></button>
					<button @click="configure(cell)" v-if="cell.alias"><span class="fa fa-cog" title="Configure Cell Content"></span></button>
					<button @click="left(row, cell)"><span class="fa fa-chevron-circle-left"></span></button>
					<button @click="right(row, cell)"><span class="fa fa-chevron-circle-right"></span></button>
					<button @click="cellUp(row, cell)"><span class="fa fa-chevron-circle-up"></span></button>
					<button @click="cellDown(row, cell)"><span class="fa fa-chevron-circle-down"></span></button>
					<button @click="addRow(cell)"><span class="fa fa-plus" title="Add Row"></span></button>
					<button @click="removeCell(row.cells, cell)"><span class="fa fa-times" title="Remove Cell"></span></button>
				</div>
				
				<div v-if="edit && cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row), rerender: function() { return false } }"></div>
				<template v-else-if="cell.alias && shouldRenderCell(row, cell)">
					<n-sidebar v-if="cell.target == 'sidebar'" @close="close(cell)">
						<div v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row) }"></div>
					</n-sidebar>
					<n-prompt v-if="cell.target == 'prompt'" @close="close(cell)">
						<div v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row) }"></div>
					</n-prompt>
					<div v-else v-route-render="{ alias: cell.alias, parameters: getParameters(row, cell), mounted: getMountedFor(cell, row) }"></div>
				</template>
				
				<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
					:parameters="parameters"
					:events="events"
					:ref="page.name + '_' + cell.id + '_rows'"
					:local-state="getLocalState(row, cell)"
					@removeRow="function(row) { $confirm({message:'Are you sure you want to remove this row?'}).then(function() { cell.rows.splice(cell.rows.indexOf(row), 1) }) }"/>
			</div>
			<n-sidebar v-if="configuring == row.id" @close="configuring = null" class="settings">
				<n-form class="layout2">
					<n-collapsible title="Row Settings">
						<n-form-text label="Row Id" v-model="row.customId"/>
						<n-form-text label="Row Name" v-model="row.name"/>
						<n-form-combo label="Show On" v-model="row.on" :filter="getAvailableEvents"/>
						<n-form-text label="Class" v-model="row.class"/>
						<n-form-text label="Condition" v-model="row.condition"/>
						<n-form-combo label="Direction" v-model="row.direction" :items="['horizontal', 'vertical']"/>
						<n-form-combo label="Alignment" v-model="row.align" :items="['center', 'flex-start', 'flex-end', 'stretch', 'baseline']"/>
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
			<div class="page-row-menu n-page-menu" v-if="edit">
				<label>{{row.name}}</label>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="configuring = row.id"><span class="fa fa-cog"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="up(row)"><span class="fa fa-chevron-circle-up"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="down(row)"><span class="fa fa-chevron-circle-down"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="addCell(row)"><span class="fa fa-plus" title="Add Cell"></span></button>
				<button v-if="!row.collapsed" :style="rowButtonStyle(row)" @click="$emit('removeRow', row)"><span class="fa fa-times" title="Remove Row"></span></button>
				<button @click="row.collapsed = !row.collapsed"><span class="fa" :class="{'fa-minus-square': !row.collapsed, 'fa-plus-square': row.collapsed }"></span></button>
			</div>
		</div>
	</div>
</template>

<template id="n-prompt">
	<div class="n-prompt">
		<div class="n-prompt-content">
			<slot></slot>
		</div>
	</div>
</template>
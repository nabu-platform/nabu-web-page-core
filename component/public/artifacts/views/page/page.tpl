<template id="nabu-cms-page">
	<div class="page" :class="classes" :page="page.name" @drop="dropMenu($event)" @dragover="$event.preventDefault()">
		<div class="page-menu" v-if="edit">
			<button @click="configuring = !configuring"><span class="n-icon n-icon-cog" title="Configure"></span></button>
			<button @click="addRow(page.content)"><span class="n-icon n-icon-plus" title="Add Row"></span></button>
			<button @click="$services.page.update(page)"><span class="n-icon n-icon-save" title="Save"></span></button>
			<button @click="edit = false"><span class="n-icon n-icon-sign-out" title="Stop Editing"></span></button>
		</div>
		<div class="page-edit" v-else-if="$services.page.canEdit()" :draggable="true" 
				@dragstart="dragMenu($event)"
				:style="{'top': page.content.menuY ? page.content.menuY + 'px' : '0px', 'left': page.content.menuX ? page.content.menuX + 'px' : '0px'}">
			<span>{{page.name}}</span>
			<span class="n-icon n-icon-pencil" @click="edit = !edit"></span>
			<span class="n-icon n-icon-files-o" v-route:pages></span>
			<span class="n-icon" :class="'n-icon-' + $services.page.cssStep" v-if="$services.page.cssStep"></span>
		</div>
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-collapsible title="Page Settings">
					<n-form-text v-model="page.name" label="Name"/>
					<n-form-text v-model="page.path" label="Path"/>
					<n-form-text v-model="page.content.class" label="Class"/>
				</n-collapsible>
				<n-collapsible v-if="$services.page.getPageParameters(page).length" title="Initial State" class="list">
					<div class="list-actions">
						<button @click="addState">Add State</button>
					</div>
					<n-collapsible class="list-item" :title="state.name" v-for="state in page.content.states">
						<n-form-text v-model="state.name" label="Name" :required="true"/>
						<n-form-combo :value="state.operation" :filter="getStateOperations" label="Operation" @input="function(newValue) { setStateOperation(state, newValue) }"/>
						<n-page-mapper v-if="state.operation" :to="getOperationParameters(state.operation)"
							:from="{page:$services.page.getPageParameters(page)}" 
							v-model="state.bindings"/>
					</n-collapsible>
				</n-collapsible>
				<n-collapsible title="Query Parameters">
					<div class="list-actions">
						<button @click="page.content.query.push('unnamed')">Add Query Parameter</button>
					</div>
					<n-form-section class="list-row" v-for="i in Object.keys(page.content.query)">
						<n-form-text v-model="page.content.query[i]"/>
						<button @click="removeQuery(i)"><span class="n-icon n-icon-trash"></span></button>
					</n-form-section>
				</n-collapsible>
				<n-collapsible title="Actions" class="list">
					<div class="list-actions">
						<button @click="addAction">Add Action</button>
					</div>
					<n-collapsible class="list-item" :title="action.name" v-for="action in page.content.actions">
						<n-form-text v-model="action.name" label="Name" :required="true"/>
						<n-form-text v-model="action.confirmation" label="Confirmation Message"/>
						<n-form-combo v-model="action.on" label="Trigger On" :items="getAvailableEvents()"/>
						<n-form-combo v-model="action.route" v-if="!action.operation" label="Redirect" :filter="filterRoutes"/>
						<n-form-text v-model="action.anchor" v-if="action.route" label="Anchor"/>
						<n-form-combo v-model="action.operation" v-if="!action.route" label="Operation" :filter="getOperations" />
						<n-page-mapper v-if="action.operation && !action.route" :to="getOperationParameters(action.operation)"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<n-page-mapper v-if="action.route" :to="$services.page.getRouteParameters($services.router.get(action.route))"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<div class="list-item-actions">
							<button @click="page.content.actions.splice(page.content.actions.indexOf(action), 1)"><span class="n-icon n-icon-trash"></span></button>
						</div>
					</n-collapsible>
				</n-collapsible>
			</n-form>
		</n-sidebar>
		<n-page-rows :rows="page.content.rows" v-if="page.content.rows" :page="page" :edit="edit"
			:parameters="parameters"
			:events="events"
			:ref="page.name + '_rows'"
			@removeRow="function(row) { page.content.rows.splice(page.content.rows.indexOf(row), 1) }"/>
	</div>
</template>

<template id="nabu-cms-page-rows">
	<div class="page-rows">
		<div v-for="row in rows" class="page-row" :id="page.name + '_' + row.id" :class="['page-row-' + row.cells.length, row.class ? row.class : null ]" :key="row.id">
			<div v-if="row.customId" class="custom-row custom-id" :id="row.customId"><!-- to render stuff in without disrupting the other elements here --></div>
			<div :style="getStyles(cell)" v-for="cell in row.cells" v-if="edit || shouldRenderCell(cell) || cell.rows.length" :id="page.name + '_' + row.id + '_' + cell.id" :class="[{'page-cell': edit || !cell.target || cell.target == 'page'}, cell.class ? cell.class : null ]" :key="cell.id">
				<div v-if="cell.customId" class="custom-cell custom-id" :id="cell.customId"><!-- to render stuff in without disrupting the other elements here --></div>
				<n-sidebar v-if="configuring == cell.id" @close="configuring = null" class="settings" key="cell-settings">
					<n-form class="layout2" key="cell-form">
						<n-form-section>
							<n-collapsible title="Cell Settings" key="cell-settings">
								<n-form-text label="Cell Id" v-model="cell.customId"/>
								<n-form-text label="Cell Width (flex)" v-model="cell.width"/>
								<n-form-text label="Cell Height (any)" v-model="cell.height"/>
								<n-form-text label="Class" v-model="cell.class"/>
							</n-collapsible>
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
							<n-collapsible title="Eventing" key="cell-events">
								<n-form-combo label="Show On" v-model="cell.on" :items="getAvailableEvents()"/>
								<n-form-combo label="Target" v-if="cell.on" :items="['page', 'sidebar', 'prompt']" v-model="cell.target"/>
							</n-collapsible>
						</n-form-section>
					</n-form>
				</n-sidebar>
				<div class="page-cell-menu n-page-menu" v-if="edit">
					<button @click="configuring = cell.id"><span class="n-icon n-icon-magic" title="Set Cell Content"></span></button>
					<button @click="configure(cell)" v-if="cell.alias"><span class="n-icon n-icon-cog" title="Configure Cell Content"></span></button>
					<button @click="left(row, cell)"><span class="n-icon n-icon-chevron-circle-left"></span></button>
					<button @click="right(row, cell)"><span class="n-icon n-icon-chevron-circle-right"></span></button>
					<button @click="cellUp(row, cell)"><span class="n-icon n-icon-chevron-circle-up"></span></button>
					<button @click="cellDown(row, cell)"><span class="n-icon n-icon-chevron-circle-down"></span></button>
					<button @click="addRow(cell)"><span class="n-icon n-icon-plus" title="Add Row"></span></button>
					<button @click="removeCell(row.cells, cell)"><span class="n-icon n-icon-times" title="Remove Cell"></span></button>
				</div>
				
				<div v-if="edit && cell.alias" v-route-render="{ alias: cell.alias, parameters: getParameters(cell), mounted: getMountedFor(cell) }"></div>
				<template v-else-if="shouldRenderCell(cell)">
					<n-sidebar v-if="cell.target == 'sidebar'" @close="close(cell)">
						<div v-route-render="{ alias: cell.alias, parameters: getParameters(cell), mounted: getMountedFor(cell) }"></div>
					</n-sidebar>
					<n-prompt v-if="cell.target == 'prompt'" @close="close(cell)">
						<div v-route-render="{ alias: cell.alias, parameters: getParameters(cell), mounted: getMountedFor(cell) }"></div>
					</n-prompt>
					<div v-else v-route-render="{ alias: cell.alias, parameters: getParameters(cell), mounted: getMountedFor(cell) }"></div>
				</template>
				
				<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
					:parameters="parameters"
					:events="events"
					:ref="page.name + '_' + cell.id + '_rows'"
					@removeRow="function(row) { cell.rows.splice(cell.rows.indexOf(row), 1) }"/>
			</div>
			<n-sidebar v-if="configuring == row.id" @close="configuring = null" class="settings">
				<n-form class="layout2">
					<n-collapsible title="Row Settings">
						<n-form-text label="Row Id" v-model="row.customId"/>
						<n-form-text label="Class" v-model="row.class"/>
					</n-collapsible>
				</n-form>
			</n-sidebar>
			<div class="page-row-menu n-page-menu" v-if="edit">
				<button @click="configuring = row.id"><span class="n-icon n-icon-cog"></span></button>
				<button @click="up(row)"><span class="n-icon n-icon-chevron-circle-up"></span></button>
				<button @click="down(row)"><span class="n-icon n-icon-chevron-circle-down"></span></button>
				<button @click="addCell(row)"><span class="n-icon n-icon-plus" title="Add Cell"></span></button>
				<button @click="$emit('removeRow', row)"><span class="n-icon n-icon-times" title="Remove Row"></span></button>
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
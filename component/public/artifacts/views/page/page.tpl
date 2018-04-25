<template id="nabu-cms-page">
	<div class="page" :class="classes" :page="page.name" @drop="dropMenu($event)" @dragover="$event.preventDefault()">
		<div class="page-menu" v-if="edit">
			<button @click="configuring = !configuring"><span class="n-icon n-icon-cog" title="Configure"></span></button>
			<button @click="addRow(page.content)"><span class="n-icon n-icon-plus" title="Add Row"></span></button>
			<button @click="$services.page.update(page)"><span class="n-icon n-icon-save" title="Save"></span></button>
			<button @click="edit = false"><span class="n-icon n-icon-sign-out" title="Stop Editing"></span></button>
		</div>
		<div class="page-edit" v-else-if="canEdit()" :draggable="true" 
				@dragstart="dragMenu($event)"
				:style="{'top': page.content.menuY ? page.content.menuY + 'px' : '0px', 'left': page.content.menuX ? page.content.menuX + 'px' : '0px'}">
			<span>{{page.name}}</span>
			<span class="n-icon n-icon-pencil" @click="edit = !edit"></span>
			<span class="n-icon n-icon-files-o" v-route:pages></span>
		</div>
		<n-sidebar v-if="configuring" @close="configuring = false">
			<n-form class="layout2">
				<n-form-section>
					<n-form-text v-model="page.name" label="Name"/>
					<n-form-text v-model="page.path" label="Path"/>
					<n-form-text v-model="page.content.class" label="Class"/>
				</n-form-section>
				<n-form-section>
					<h2>Query Parameters</h2>
					<button @click="page.content.query.push('unnamed')">Add Query Parameter</button>
					<n-form-section class="query" v-for="i in Object.keys(page.content.query)">
						<n-form-text v-model="page.content.query[i]"/>
						<button @click="removeQuery(i)"><span class="n-icon n-icon-times"></span></button>
					</n-form-section>
				</n-form-section>
				<n-form-section class="actions">
					<h2>Actions</h2>
					<button @click="addAction">Add Action</button>
					<n-form-section class="action" v-for="action in page.content.actions">
						<n-form-text v-model="action.name" label="Name"/>
						<n-form-text v-model="action.confirmation" label="Confirmation Message"/>
						<n-form-combo v-model="action.on" label="Trigger On" :items="getAvailableEvents()"/>
						<n-form-combo v-model="action.operation" label="Operation" :filter="getOperations" />
						<n-page-mapper v-if="action.operation" :to="getOperationParameters(action.operation)"
							:from="availableParameters" 
							v-model="action.bindings"/>
						<button @click="page.content.actions.splice(page.content.actions.indexOf(action), 1)">Delete Action</button>
					</n-form-section>
				</n-form-section>
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
				<n-sidebar v-if="configuring == cell.id" @close="configuring = null">
					<n-form class="layout2">
						<n-form-section>
							<n-form-text label="Cell Id" v-model="cell.customId"/>
							<n-form-text label="Cell Width" v-model="cell.width"/>
							<n-form-combo label="Show On" v-model="cell.on" :items="getAvailableEvents()"/>
							<n-form-combo label="Route" :filter="filterRoutes" v-model="cell.alias"
								:required="true"/>
							<n-form-combo label="Target" v-if="cell.on" :items="['page', 'sidebar', 'prompt']" v-model="cell.target"/>
							<n-form-text label="Class" v-model="cell.class"/>
						</n-form-section>
						<n-page-mapper :to="$services.page.getRouteParameters($services.router.get(cell.alias))" v-if="cell.alias" 
							:from="getAvailableParameters(cell)" 
							v-model="cell.bindings"/>
					</n-form>
				</n-sidebar>
				<div class="page-cell-menu n-page-menu" v-if="edit">
					<button @click="configuring = cell.id"><span class="n-icon n-icon-magic" title="Set Cell Content"></span></button>
					<button @click="configure(cell)" v-if="cell.alias"><span class="n-icon n-icon-cog" title="Configure Cell Content"></span></button>
					<button @click="left(row, cell)"><span class="n-icon n-icon-chevron-circle-left"></span></button>
					<button @click="right(row, cell)"><span class="n-icon n-icon-chevron-circle-right"></span></button>
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
			<n-sidebar v-if="configuring == row.id" @close="configuring = null">
				<n-form-text label="Row Id" v-model="row.customId"/>
				<n-form-text label="Class" v-model="row.class"/>
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
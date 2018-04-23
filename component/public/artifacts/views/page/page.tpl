<template id="nabu-cms-page">
	<div class="page" :class="{'edit': edit}" :page="page.name">
		<div class="page-menu" v-if="edit">
			<button @click="configuring = !configuring"><span class="n-icon n-icon-cog" title="Configure"></span></button>
			<button @click="addRow(page.content)"><span class="n-icon n-icon-plus" title="Add Row"></span></button>
			<button @click="$services.page.update(page)"><span class="n-icon n-icon-save" title="Save"></span></button>
			<button @click="edit = false"><span class="n-icon n-icon-sign-out" title="Stop Editing"></span></button>
		</div>
		<div class="page-edit" v-else-if="canEdit()">
			<span class="n-icon n-icon-pencil" @click="edit = !edit"></span>
		</div>
		<n-sidebar v-if="configuring" @close="configuring = false">
			<n-form class="layout2">
				<n-form-section>
					<n-form-text v-model="page.name" label="Name"/>
					<n-form-text v-model="page.path" label="Path"/>
				</n-form-section>
				<n-form-section>
					<h2>Query Parameters</h2>
					<button @click="page.content.query.push('unnamed')">Add Query Parameter</button>
					<n-form-section class="query" v-for="i in Object.keys(page.content.query)">
						<n-form-text v-model="page.content.query[i]"/>
						<button @click="removeQuery(i)"><span class="n-icon n-icon-times"></span></button>
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
		<div v-for="row in rows" class="page-row" :id="page.name + '_' + row.id" :class="'page-row-' + row.cells.length">
			<div v-for="cell in row.cells" v-if="row.cells" class="page-cell">
				<div class="page-cell-menu n-page-menu" v-if="edit">
					<button @click="setContent(cell)"><span class="n-icon n-icon-magic" title="Set Cell Content"></span></button>
					<button @click="configure(cell)" v-if="cell.alias && canConfigure(cell)"><span class="n-icon n-icon-cog" title="Configure Cell Content"></span></button>
					<button @click="addRow(cell)"><span class="n-icon n-icon-plus" title="Add Row"></span></button>
					<button @click="removeCell(row.cells, cell)"><span class="n-icon n-icon-times" title="Remove Cell"></span></button>
				</div>
				<div v-if="shouldRenderCell(cell)" v-route-render="{ alias: cell.alias, parameters: getParameters(cell), mounted: getMountedFor(cell) }" :id="page.name + '_' + cell.id"></div>
				<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
					:parameters="parameters"
					:events="events"
					:ref="page.name + '_' + cell.id + '_rows'"
					@removeRow="function(row) { cell.rows.splice(cell.rows.indexOf(row), 1) }"/>
			</div>
			<div class="page-row-menu n-page-menu" v-if="edit">
				<button @click="addCell(row)"><span class="n-icon n-icon-plus" title="Add Cell"></span></button>
				<button @click="$emit('removeRow', row)"><span class="n-icon n-icon-times" title="Remove Row"></span></button>
			</div>
		</div>
	</div>
</template>
<template id="nabu-cms-page">
	<div class="page" :class="'page-' + page.name">
		<div class="page-menu" v-if="edit">
			<n-form-text v-model="page.path" label="Path"/>
			<button @click="addRow(page.content)">Add Row</button>
			<button @click="$services.page.update(page)">Save</button>
		</div>
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
			<div class="page-row-menu" v-if="edit">
				<button @click="addCell(row)">Add Cell</button>
				<button @click="$emit('removeRow', row)">Remove This Row</button>
			</div>
			<div v-for="cell in row.cells" v-if="row.cells" class="page-cell">
				<div class="page-cell-menu" v-if="edit">
					<button @click="setContent(cell)">Set content</button>
					<button @click="addRow(cell)">Add Row</button>
					<button @click="removeCell(row.cells, cell)">Remove This Cell</button>
				</div>
				<div :id="page.name + '_' + cell.id"></div>
				<n-page-rows v-if="cell.rows && cell.rows.length" :rows="cell.rows" :page="page" :edit="edit"
					:parameters="parameters"
					:events="events"
					:ref="page.name + '_' + cell.id + '_rows'"
					@removeRow="function(row) { cell.rows.splice(cell.rows.indexOf(row), 1) }"/>
			</div>
		</div>
	</div>
</template>
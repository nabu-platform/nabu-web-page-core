<template id="page-richtext">
	<div class="page-richtext">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Rich text settings">
						<n-form-switch v-model='cell.state.cleanStyle' label='Clean style on paste'/>
						<n-form-switch v-if="false" v-model='cell.state.highlight' label='Highlight'/>
					</n-collapsible>
				</n-form-section>
			</n-form>
		</n-sidebar>
		<n-form-richtext v-if="edit" v-model="cell.state.content" :clean-style='cell.state.cleanStyle'/>
		<div v-else-if="!cell.state.highlight" v-content.compile.sanitize="$services.page.translate(cell.state.content)"></div>
		<div v-else v-content="highlight($services.page.translate(cell.state.content))"></div>
	</div>
</template>
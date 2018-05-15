<template id="page-image">
	<div class="page-image">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Image Settings">
						<n-form-text v-model="cell.state.href" label="Link"/>
						<n-form-text v-model="cell.state.title" label="Title"/>
						<n-form-text v-model="cell.state.height" label="Height"/>
						<n-form-combo v-model="cell.state.size" label="Sizing"
							:nillable="false"
							:items="['cover', 'contain']"/>
					</n-collapsible>
				</n-form-section>
			</n-form>
		</n-sidebar>
		<div v-if="cell.state.href || href" class="image" 
			:style="{'background-image': 'url(' + (cell.state.href ? cell.state.href : href) + ')', height: cell.state.height ? cell.state.height : 'inherit', 'background-size': cell.state.size }"></div>
	</div>
</template>
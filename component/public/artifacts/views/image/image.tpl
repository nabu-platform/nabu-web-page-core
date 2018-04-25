<template id="page-image">
	<div class="page-image">
		<n-sidebar v-if="configuring" @close="configuring = false">
			<h2 slot="header">Image</h2>
			<n-form class="layout2">
				<n-form-section>
					<n-form-text v-model="cell.state.href" label="Link"/>
					<n-form-text v-model="cell.state.title" label="Title"/>
					<n-form-text v-model="cell.state.height" label="Height"/>
					<n-form-combo v-model="cell.state.size" label="Sizing"
						:nillable="false"
						:items="['cover', 'contain']"/>
				</n-form-section>
			</n-form>
		</n-sidebar>
		<div class="image" :style="{'background-image': 'url(' + cell.state.href + ')', height: cell.state.height ? cell.state.height : 'inherit', 'background-size': cell.state.size }"></div>
	</div>
</template>
<template id="page-richtext">
	<div class="page-richtext">
		<n-form-richtext v-if="edit" v-model="cell.state.content"/>
		<div v-else v-content="cell.state.content"></div>
	</div>
</template>
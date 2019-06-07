<template id="page-markdown">
	<div class="page-markdown">
		<n-form-text type="area" v-if="edit" v-model="cell.state.content"/>
		<div v-else v-content="highlight(cell.state.content)"></div>
	</div>
</template>
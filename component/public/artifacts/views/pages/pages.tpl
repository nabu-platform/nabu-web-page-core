<template id="nabu-cms-pages">
	<div>
		<h1>Pages</h1>
		<div v-for="page in $services.page.pages">
			<!-- support for pages with input values -->
			<a v-route="{ alias: $services.page.alias(page) }">{{ page.name }}</a>
		</div>
		<button @click="create">Create New Page</button>
	</div>
</template>
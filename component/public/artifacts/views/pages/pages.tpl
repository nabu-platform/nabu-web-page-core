<template id="nabu-cms-pages">
	<n-form class="layout2">
		<h1>Pages</h1>
		<div v-for="page in $services.page.pages">
			<h2>{{page.name}}</h2>
			<n-form-switch label="Is initial" v-model="page.content.initial" @input="$services.page.update(page)"/>
			<!-- support for pages with input values -->
			<a v-route="{ alias: $services.page.alias(page) }">View</a>
		</div>
		<footer>
			<button @click="create">Create New Page</button>
		</footer>
	</n-form>
</template>
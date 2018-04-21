<template id="cms-page-add-cell">
	<n-form class="layout2 cms-page">
		<n-form-section>
			<n-form-combo label="Route" :filter="filterRoutes" v-model="route"
				:formatter="function(x) { return x.alias }"
				:required="true"/>
		</n-form-section>
		<n-page-mapper :to="parameters" v-if="parameters.length" :from="{page:$services.page.getPageParameters(page)}" v-model="bindings"/>
		<footer class="actions">
			<a href="javascript:void(0)" @click="$reject()">%{Cancel}</a>
			<button @click="set" :disabled="!route">%{Set Content}</button>
		</footer>
	</n-form>
</template>
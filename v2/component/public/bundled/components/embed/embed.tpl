<template id="page-embed-component">
	<component v-if="cell.state.route" :is="cell.state.route" v-bind="getBindings()" class="page-embed-component"/>
</template>

<template id="page-embed-component-configure">
	<div class="page-embed-component-configure">
		<n-form-combo v-model="cell.state.embedComponent" label="The component used to render a marker" :filter="$services.page.getRoutes"
			:formatter="function(x) { return x.alias }"
			:extracter="function(x) { return x.alias }"/>
		<n-page-mapper v-if="cell.state.embedComponent" :to="$services.page.getRouteParameters($services.router.get(cell.state.markerComponent))"
			:from="$services.page.getAvailableParameters(page, null, true)" 
			v-model="cell.state.embedBindings"/>
	</div>
</template>
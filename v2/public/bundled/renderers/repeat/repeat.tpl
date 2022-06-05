<template id="renderer-repeat">
	<div>
		<template v-if="!edit">
			<div v-for="(item, index) in items">
				<div class="is-repeat-content" 
					:key="'repeat_' + instanceCounter + '_rendered_' + index"
					v-route-render="{ alias: alias, parameters: getParameters(item), mounted: mounted }"></div>
			</div>
		</template>
		<template v-else>
			<slot></slot>
		</template>
	</div>
</template>
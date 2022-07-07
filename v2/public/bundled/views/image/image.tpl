<template id="page-image-configure">
	<div>
		<n-collapsible title="Image Settings">
			<n-form-text v-model="cell.state.title" label="Title"/>
			<n-form-text v-model="cell.state.href" label="Full Link" v-if="!cell.state.imagePath"/>
			<n-form-text v-model="cell.state.imagePath" label="Image path to search" v-if="!cell.state.href"/>
			<n-form-switch v-model="cell.state.absolute" label="Absolute" v-if="!cell.state.inline"/>
			<n-form-switch v-model="cell.state.inline" label="Inline Rendering" v-if="cell.state.href && cell.state.href.match(/.*\.svg$/)">
		</n-collapsible>
	</div>
</template>

<template id="page-image">
	<div class="page-image" :class="{'is-editing': edit}">
		<div class="is-inline-image-menu" v-if="edit">
			<button class="is-button is-variant-primary is-size-xsmall is-position-center" :disabled="!hasPrevious" @click="previous"><icon name="chevron-left"/><span class="is-text">Previous</span></button>
			<n-input-file v-model="files" @change="upload" :types="['image/*']"/>
			<button class="is-button is-variant-primary is-size-xsmall is-position-center" :disabled="!hasNext" @click="next"><icon name="chevron-right"/><span class="is-text">Next</span></button>
		</div>
		
		<img v-if="!href && edit" src="${server.root()}resources/modules/image/placeholder.svg" class="is-image is-fit-cover"
			:class="getChildComponentClasses('image')"/>
			
		<div ref="inline" v-content="inlineContent" v-else-if="href && cell.state.inline" class="image" 
			:class="getChildComponentClasses('image')"
			:title="cell.state.title"></div>

		<img v-else="href" :src="href"
			class="is-image"
			:class="getChildComponentClasses('image')"
			:title="cell.state.title"/>
	</div>
</template>
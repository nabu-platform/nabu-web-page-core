<template id="page-image-configure">
	<n-form class="layout2">
		<n-form-section>
			<n-collapsible title="Image Settings">
				<n-form-text v-model="cell.state.href" v-if="false" label="Link"/>
				<n-form-text v-model="cell.state.title" label="Title"/>
				<n-form-text v-model="cell.state.height" label="Height"/>
				<n-form-text v-model="cell.state.imagePath" label="Image Path"/>
				<n-form-switch v-model="cell.state.absolute" label="Absolute" v-if="!cell.state.inline"/>
				<n-form-combo v-model="cell.state.size" label="Sizing"
					:nillable="false"
					:items="['cover', 'contain', 'native']"/>
				<n-form-switch v-model="cell.state.inline" label="Inline Rendering"/>
			</n-collapsible>
			<n-collapsible title="Image Content" class="images">
				<n-input-file v-model="files" @change="upload" :types="['image']"/>
				<div class="image-container" v-for="image in images" :class="{'selected': image.relativePath == cell.state.href }" @click="cell.state.href = image.relativePath">
					<div class="image"
						:title="image.path"
						:style="{'background-image': 'url(${server.root()}' + image.relativePath + ')', height: '10rem', 'background-size': 'cover', width:'15rem' }"></div>
					<span >{{image.path}}</span>
				</div>
			</n-collapsible>
		</n-form-section>
	</n-form>
</template>

<template id="page-image">
	<div class="page-image" :class="{'is-editing': edit}">
		<div class="is-inline-image-menu" v-if="edit">
			<button class="is-button is-variant-primary is-size-xsmall is-position-center" :disabled="!hasPrevious" @click="previous"><icon name="chevron-left"/><span class="is-text">Previous</span></button>
			<n-input-file v-model="files" @change="upload" :types="['image/*']"/>
			<button class="is-button is-variant-primary is-size-xsmall is-position-center" :disabled="!hasNext" @click="next"><icon name="chevron-right"/><span class="is-text">Next</span></button>
		</div>
		
		<img v-if="!href && edit" src="${server.root()}resources/modules/image/placeholder.svg" class="is-image is-fit-cover" />
			
		<div ref="inline" v-content="inlineContent" v-else-if="href && cell.state.inline" class="image" 
			:title="cell.state.title"></div>

		<img v-else="href" :src="href"
			class="is-image"
			:title="cell.state.title"/>

	</div>
</template>
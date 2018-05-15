<template id="page-field-fragment-image-configure">
	<n-form-section>
		<n-form-combo :items="keys" label="Image Href" v-model="fragment.imageHref"/>
		<n-form-text v-model="fragment.imageTitle" label="Image Title"/>
		<n-form-text v-model="fragment.imageHeight" label="Image Height"/>
		<n-form-combo v-model="fragment.imageSize" label="Image Sizing"
			:nillable="false"
			:items="['cover', 'contain']"/>
	</n-form-section>
</template>

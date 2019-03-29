<template id="page-youtube">
	<div class="page-youtube">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Youtube settings">
						<n-form-text v-model='cell.state.url' label='Url'/>
						<n-form-text v-model='cell.state.width' label='Width'/>
						<n-form-text v-model='cell.state.height' label='Height'/>
						<n-form-switch v-model="cell.state.hideControls" label="Hide Controls"/>
					</n-collapsible>
				</n-form-section>
			</n-form>
		</n-sidebar>
		<iframe v-if="url" :width="cell.state.width ? cell.state.width : 560" :height="cell.state.height ? cell.state.height : 315" src="https://www.youtube.com/embed/bmLCj8Qba-M" 
			frameborder="0" 
			allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
	</div>
</template>
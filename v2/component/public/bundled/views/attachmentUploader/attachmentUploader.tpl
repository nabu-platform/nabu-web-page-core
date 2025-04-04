<template id="n-form-attachment-uploader-configure">
	<div>
		<n-form-text label='Maximum amount' v-model='field.maxFiles' placeholder="unlimited" :timeout="600" v-if="isArray"/>
		<n-form-text label='Label drop' v-model='field.dropLabel' :timeout="600"/>
		<n-form-text label='Label browse' v-model='field.browseLabel' :timeout="600"/>
		<n-form-text label='Icon browse' v-model='field.browseIcon' :timeout="600"/>
		
		<h4 class="category">Reservation</h4>
		<p class="subscript">Immediately reserve an attachment spot, binary data will be streamed lazily. The output type of the reservation should conform mostly to the expected output type from the upload.</p>
		<n-form-combo key="operation-attachment-reserevation" 
			:formatter="function(x) { return x.id }"
			:extracter="function(x) { return x.id }"
			v-model="field.reservationOperation" label="Operation" :filter="$services.page.getModifyOperations" />
							
		<n-page-mapper v-if="field.reservationOperation" :to="getReservationInputFields()"
			:key="field.reservationOperation + '-mapper'"
			:from="getAvailableReservationParameters()" 
			v-model="field.reservationBindings"/>
			
		<h4 class="category">Upload</h4>
		<p class="subscript" v-if="field.uploadOperation">Once the reservations are done, they will be added to the bound value. After that uploading of the binary data will start..</p>
		<p class="subscript" v-else>Once a file is selected, we will start uploading, the result from this service is added to the value</p>
		<n-form-combo key="operation-attachment-upload" 
			:formatter="function(x) { return x.id }"
			:extracter="function(x) { return x.id }"
			v-model="field.uploadOperation" label="Operation" :filter="$services.page.getModifyOperations" />
							
		<n-page-mapper v-if="field.uploadOperation" :to="$services.page.getSimpleKeysFor($services.page.getSwaggerOperationInputDefinition(field.uploadOperation), true, true)"
			:key="field.uploadOperation + '-mapper'"
			:from="getAvailableUploadParameters()" 
			v-model="field.uploadBindings"/>
			
		<n-form-combo key="operation-attachment-url" 
			v-if="field.uploadOperation && field.reservationOperation"
			label="URL field"
			after="We can temporarily store a frontend URL in a reserved document until the actual store is ready"
			v-model="field.urlField" 
			:filter="getOutputUrlFieldOptions" />
			
		<h4 class="category">Images</h4>
		<n-form-text label='Max width' v-model='field.maxWidth' :timeout="600"/>
		<n-form-text label='Max height' v-model='field.maxHeight' :timeout="600"/>
	</div>
</template> 


<template id="n-form-attachment-uploader">
	<div class="n-form-attachment-uploader">
		<n-input-file :types='field.fileTypes' ref='form' :amount='remaining > 1 ? remaining : 1'
			v-if="!readOnly && (remaining == null || remaining > 0)"
			@change='changed'
			:value='files'
			:name='field.name'
			:capture="field.capture"
			:dropLabel='field.dropLabel ? $services.page.translate(field.dropLabel) : null'
			:browseLabel='field.browseLabel ? $services.page.translate(field.browseLabel) : null'
			:browseIcon='field.browseIcon'
			:deleteIcon='field.deleteIcon'
			:visualize-file-names="false"
			class="is-column"
			:class="getChildComponentClasses('file-input')"
			:button-class="[getChildComponentClasses('file-input-button'), {'has-text': field.browseLabel, 'has-icon': field.browseIcon }]"
			/>
		<n-messages :messages="messages" v-if="messages && messages.length"/>
		<div class="is-content-after" v-if="field.after" v-html="$services.page.translate(field.after)"></div>
	</div>
</template>
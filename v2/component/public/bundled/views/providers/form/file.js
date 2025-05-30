Vue.component("page-form-input-file-configure", {
	template: "<div class='input-file-configure'>"
		+ "		<h2 class='section-title'>File upload</h2>"
		+ "		<div class='is-column is-spacing-medium'>"
		// ignore body as this presumes a pure binary upload, we use headers then
		+ "<n-form-text label='Label drop' v-model='field.dropLabel' :timeout='600'/>"
		+ "<n-form-text label='Label browse' v-model='field.browseLabel' :timeout='600'/>"
		+ "<n-form-text label='Icon browse' v-model='field.browseIcon' :timeout='600'/>"
		+ "<n-form-text label='Max file size (bytes)' v-model='field.maxFileSize' :timeout='600'/>"
		+ "<n-form-switch label='Show selected files' v-model='field.visualizeFileNames'/>"
		+ "<n-form-text v-if='field.visualizeFileNames' label='Delete icon' v-model='field.deleteIcon' :timeout='600'/>"
		+ "	<n-form-section v-for='i in Object.keys(field.fileTypes)' class='list-row'>"
		+ "		<n-form-text v-model='field.fileTypes[i]' label='File Type' placeholder='image/*' :timeout='600'/>"
		+ "		<span @click='field.fileTypes.splice(i)' class='fa fa-times'></span>"
		+ "</n-form-section>"
		+ "		<div class='is-row is-align-end'>"
		+ "			<button class='is-button is-variant-primary-outline is-size-xsmall' @click=\"field.fileTypes ? field.fileTypes.push(null) : $window.Vue.set(field, 'fileTypes', [null])\"><span class='fa fa-plus'></span>Filetype</button>"
		+ "		</div>"
		+ "<n-form-combo v-if=\"field.name && field.name != 'body'\" v-model='field.contentType' label='Field to store content type' :items='possibleFields'/>"
		+ "<n-form-combo v-if=\"field.name && field.name != 'body'\" v-model='field.fileName' label='Field to store file name' :items='possibleFields'/>"
		+ "</div></div>",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		// the fragment this image is in
		field: {
			type: Object,
			required: true
		},
		possibleFields: {
			type: Array,
			required: false,
			default: function() { return [] }
		}
	},
	created: function() {
		if (!this.field.fileTypes) {
			Vue.set(this.field, "fileTypes", []);
		}
	}
});

Vue.component("page-form-input-file", {
	template: "<n-form-file :types='field.fileTypes' ref='form' :amount='1'"
			+ "		:edit='!readOnly'"
			+ "		:schema='schema'"
			+ "		@change='changed'"
			+ "		:label='label'"
			+ "		:value='files'"
			+ "		:name='field.name'"
			+ " 	:drop-label='field.dropLabel ? $services.page.translate(field.dropLabel) : null'"
			+ " 	:browse-label='field.browseLabel ? $services.page.translate(field.browseLabel) : null'"
			+ " 	:browse-icon='field.browseIcon'"
			+ " 	:visualize-file-names='field.visualizeFileNames'"
			+ " 	:delete-icon='field.deleteIcon'"
			+ "		:button-class=\"getChildComponentClasses('file-upload-button')\""
			+ "		:info='field.info ? $services.page.interpret($services.page.translate(field.info), $self) : null'"
			+ "		:before='field.before ? $services.page.interpret($services.page.translate(field.before), $self) : null'"
			+ "		:after='field.after ? $services.page.interpret($services.page.translate(field.after), $self) : null'"
			+ "		:prefix='field.prefix ? $services.page.translate(field.prefix) : field.prefix'"
			+ "		:file-name-class=\"getChildComponentClasses('file-upload-name')\""
			+ "		:file-name-container-class=\"getChildComponentClasses('file-upload-name-container')\""
			+ "		:file-name-row-class=\"getChildComponentClasses('file-upload-name-row')\""
			+ "		:file-name-delete-class=\"getChildComponentClasses('file-upload-name-delete')\""
			+ "		:timeout='timeout'"
			+ "		:max-file-size='field.maxFileSize ? parseInt(field.maxFileSize) : null'"
			+ "		:disabled='disabled'/>",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		field: {
			type: Object,
			required: true
		},
		value: {
			required: true
		},
		label: {
			type: String,
			required: false
		},
		timeout: {
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		schema: {
			type: Object,
			required: false
		},
		readOnly: {
			type: Boolean,
			required: false
		},
		childComponents: {
			required: false
		}
	},
	data: function() {
		return {
			files: []
		}
	},
	// restore the previous state (if any)
	created: function() {
		if (this.value instanceof File) {
			this.files.push(this.value);
		}
		console.log("child components", this.childComponents);
	},
	computed: {
		textType: function() {
			return this.field.textType ? this.field.textType : 'text';
		}
	},
	methods: {
		getChildComponents: function() {
			return [{
				title: "Upload button",
				name: "file-upload-button",
				component: "button"
			}, {
				title: "File Name List",
				name: "file-upload-name-container",
				component: "column"
			}, {
				title: "File Name Container",
				name: "file-upload-name-row",
				component: "row"
			}, {
				title: "File Name",
				name: "file-upload-name",
				component: "content"
			}, {
				title: "File Name Delete Button",
				name: "file-upload-delete-button",
				component: "button"
			}];
		},
		changed: function(newValue) {
			var file = newValue && newValue.length ? newValue[0] : null;
			if (this.field.contentType) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				pageInstance.set(this.field.contentType, file ? file.type : null);
			}
			if (this.field.fileName) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				pageInstance.set(this.field.fileName, file ? file.name : null);
			}
			// only emit this _after_ we set the previous
			// otherwise forms with "submit on change" might trigger before the above values are set
			this.$emit("input", file);
		},
		validate: function(soft) {
			var messages = [];
			var mandatory = nabu.utils.vue.form.mandatory(this);
			if (mandatory && files.length < 1) {
				messages.push({
					soft: true,
					severity: "error",
					code: "required",
					title: "%{validation:The value is required}",
					priority: 0,
					values: {
						actual: false,
						expected: true
					},
					context: []
				});
			}
			return messages;
		}
	}
});
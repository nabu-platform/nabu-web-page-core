<template id="typography-template">
	<component :is="tag" class="is-content is-typography" :class="['is-' + tag, getChildComponentClasses('typography')]">
		<img :src="cell.state.icon.indexOf('http') == 0 ? cell.state.icon : '${server.root()}resources/' + cell.state.icon" v-if="cell.state.icon && cell.state.icon.match(/^.*\.[^.]+$/)" class="is-icon"/>
		<icon :name="cell.state.icon" v-if="cell.state.icon"/>
		<span class="is-inline-editor" v-if="edit && !cell.state.highlight" :contenteditable="true"
			 @keyup="update" @blur="update" @input="update" ref="editor" v-html-once="cell.state.content ? cell.state.content : null"
			 :placeholder="placeholder ? placeholder : tag + ' placeholder'"></span>
		<n-form-text type="area" v-else-if="edit && cell.state.highlight" v-model="cell.state.content"/>
		<span class="is-text" v-else-if="cell.state.content" v-html="cell.state.highlight ? highlight(cell.state.content) : $services.page.translate(cell.state.content)"></span>
	</component>
</template>

<template id="typography-template-configure">
	<div class="typography-template-configure is-column is-spacing-medium">
		<n-form-text v-model="cell.state.icon" label="Icon" v-if="icon"/>
		<n-form-switch v-model="cell.state.highlight" label="Highlight" v-if="highlightable && canHighlight" after="This will perform syntax highlighting, based on the format. If no format is configured, a best effort guess is made"/>
		<n-form-combo v-model="cell.state.highlightFormat" label="Highlight Format" v-if="cell.state.highlight" :items="['html', 'bash', 'sql', 'yaml', 'css', 'scss', 'javascript', 'java', 'c++', 'xml', 'json', 'markdown', 'latex', 'http']" />
	</div>
</template>



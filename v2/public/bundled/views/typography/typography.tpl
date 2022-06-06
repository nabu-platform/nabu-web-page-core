<template id="typography-template">
	<component :is="tag" class="is-content is-typography" :class="['is-' + tag, getChildComponentClasses('typography')]">
		<img :src="cell.state.icon.indexOf('http') == 0 ? cell.state.icon : '${server.root()}resources/' + cell.state.icon" v-if="cell.state.icon && cell.state.icon.match(/^.*\.[^.]+$/)" class="is-icon"/>
		<icon :name="cell.state.icon" v-if="cell.state.icon"/>
		<span class="is-inline-editor" v-if="false && edit && !cell.state.highlight" :contenteditable="true"
			 @keyup="update" @blur="update" @input="update" ref="editor" v-html-once="cell.state.content ? cell.state.content : null"
			 :placeholder="placeholder ? placeholder : tag + ' placeholder'"></span>
		<n-form-richtext v-model="cell.state.content" :support-blocks="false" v-if="edit && !cell.state.highlight" :placeholder="placeholder ? placeholder : tag + ' placeholder'"/>
		<n-form-text type="area" v-else-if="edit && cell.state.highlight" v-model="cell.state.content"/>
		<span class="is-text" v-else-if="cell.state.content" 
			v-html="cell.state.highlight ? highlight(getContentWithVariables()) : $services.page.translate($services.page.interpret(getContentWithVariables(), $self))"></span>
	</component>
</template>

<template id="typography-template-configure">
	<div class="typography-template-configure is-column is-spacing-medium">
		<n-form-text v-model="cell.state.icon" label="Icon" v-if="icon"/>
		<n-form-switch v-model="cell.state.highlight" label="Highlight" v-if="highlightable && canHighlight" after="This will perform syntax highlighting, based on the format. If no format is configured, a best effort guess is made"/>
		<n-form-combo v-model="cell.state.highlightFormat" label="Highlight Format" v-if="cell.state.highlight" :items="['html', 'bash', 'sql', 'yaml', 'css', 'scss', 'javascript', 'java', 'c++', 'xml', 'json', 'markdown', 'latex', 'http']" />
		
		<div v-for="variable in variables" class="is-column is-color-body is-spacing-medium">
			<h4 class="is-h4">{{variable}}</h4>
			<n-form-combo v-model="cell.state.fragments[variable].key" :filter="$services.page.getAllAvailableKeys.bind($self, page, true)" label="Variable to bind"/>
			<page-formatted-configure :page="page" :cell="cell" 
				:fragment="cell.state.fragments[variable]" 
				:allow-html="true"
				:keys="$services.page.getAllAvailableKeys(page, true)"/>
		</div>
	</div>
</template>



<template id="page-tag">
	<div class="is-tag" :class="getChildComponentClasses('page-tag')" v-if="getValue() != null || edit">
		<img :src="icon.indexOf('http') == 0 ? icon : '${server.root()}resources/' + icon" v-if="icon && icon.match(/^.*\.[^.]+$/)" class="is-icon" @click="reset"/>
		<icon :name="icon" v-if="icon" @click.native="reset"/>
		<span class="is-text">
			<span class="is-text-subscript" v-if="cell.state.content && !edit" v-html="$services.page.translate($services.page.interpret(cell.state.content, $self))"></span>
			<span class="is-text-subscript is-inline-editor" v-else-if="edit" 
				v-html-once="cell.state.content ? cell.state.content : null"
				ref="editor"
				@keyup="update" @blur="update" @input="update"
				:contenteditable="true"
				placeholder="Tag label"></span>
			<span class="is-text-value" v-html="getValue()"></span>
		</span>
	</div>
</template>

<template id="page-tag-configure">
	<div class="is-column">
		
		<div class="is-column is-spacing-medium">
			<n-form-combo v-model="cell.state.field" :filter="$services.page.getAllAvailableKeys.bind($self, page, false)" label="Field value to show"/>
			<n-form-text v-model="cell.state.icon" label="Icon" placeholder="times"/>
		</div>
		
	</div>
</template>
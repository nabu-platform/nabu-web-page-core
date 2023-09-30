<template id="renderer-repeat">
	<div v-fragment>
		<template v-if="!edit && !loading && state.records.length">
			<template v-if="fragmentPage.content.repeatType == 'cell'">
				<component :is="getComponent()" v-for="(record, index) in state.records" :class="getCellClasses()" :page="page" :target="target">
					<template v-if="!edit && !loading && state.records.length && fragmentPage.content.rows.length >= 2">
						<n-page :page="fragmentPage"
							@update="function() { update(record) }"
							@click.native="handleClick($event, record)"
							:fragment-parent="getPageInstance()"
							:record-index="index" class="is-repeat-content" 
							:draggable="target.repeat.enableDrag"
							@dragstart.native="onDragStart($event, record)"
							:class="[getChildComponentClasses('repeat-content'), {'is-selected': state.selected.indexOf(record) >= 0 }, {'is-selectable': target.repeat.selectable}]"
							:key="'repeat_' + instanceCounter + '_rendered_' + getKey(record)"
							:parameters="getParameters(record)"
							@beforeMount="beforeMount"
							@ready="mounted"/>
					</template>
					<template v-else-if="!edit && !loading && state.records.length">
						<n-page-optimized :page="fragmentPage"
							@update="function() { update(record) }"
							@click.native="handleClick($event, record)"
							:fragment-parent="getPageInstance()"
							:record-index="index" class="is-repeat-content" 
							:draggable="target.repeat.enableDrag"
							@dragstart.native="onDragStart($event, record)"
							:class="[getChildComponentClasses('repeat-content'), {'is-selected': state.selected.indexOf(record) >= 0 }, {'is-selectable': target.repeat.selectable}]"
							:key="'repeat_' + instanceCounter + '_rendered_' + getKey(record)"
							:parameters="getParameters(record)"
							@beforeMount="beforeMount"
							@ready="mounted"/>
					</template>
				</component>
			</template>
			<template v-else>
				<template v-if="!edit && !loading && state.records.length && fragmentPage.content.rows.length >= 2">
					<n-page :page="fragmentPage"
						@update="function() { update(record) }"
						@click.native="handleClick($event, record)"
						:fragment-parent="getPageInstance()"
						v-for="(record, index) in state.records" :record-index="index" class="is-repeat-content" 
						:draggable="target.repeat.enableDrag"
						@dragstart.native="onDragStart($event, record)"
						:class="[getChildComponentClasses('repeat-content'), {'is-selected': state.selected.indexOf(record) >= 0 }, {'is-selectable': target.repeat.selectable}]"
						:key="'repeat_' + instanceCounter + '_rendered_' + getKey(record)"
						:parameters="getParameters(record)"
						@beforeMount="beforeMount"
						@ready="mounted"/>
				</template>
				<template v-else-if="!edit && !loading && state.records.length">
					<n-page-optimized :page="fragmentPage"
						@update="function() { update(record) }"
						@click.native="handleClick($event, record)"
						:fragment-parent="getPageInstance()"
						v-for="(record, index) in state.records" :record-index="index" class="is-repeat-content" 
						:draggable="target.repeat.enableDrag"
						@dragstart.native="onDragStart($event, record)"
						:class="[getChildComponentClasses('repeat-content'), {'is-selected': state.selected.indexOf(record) >= 0 }, {'is-selectable': target.repeat.selectable}]"
						:key="'repeat_' + instanceCounter + '_rendered_' + getKey(record)"
						:parameters="getParameters(record)"
						@beforeMount="beforeMount"
						@ready="mounted"/>
				</template>
			</template>
		</template>
		<template v-else-if="!edit && !loading && !state.records.length">
			<component :is="getMessageComponent()" v-if="target.repeat.emptyPlaceholder"><span class="is-text" v-html="$services.page.translate(target.repeat.emptyPlaceholder)"></span></component>
		</template>
		<template v-else-if="!edit && loading">
			<component :is="getMessageComponent()" v-if="target.repeat.loadingPlaceholder"><span class="is-text" v-html="$services.page.translate(target.repeat.loadingPlaceholder)"></span></component>
		</template>
		<template v-else-if="edit && getComponent()">
			<component :is="getComponent()" :page="page" :target="target" :class="getComponentClassesForEdit()">
				<slot></slot>
			</component>
		</template>
		<template v-else>
			<slot></slot>
		</template>
	</div>
</template>

<template id="renderer-repeat-configure">
	<div class="is-column is-spacing-vertical-gap-medium">
		<n-form-combo label="Repeat over" 
			v-model="target.repeat.type" :filter="getRepeatTypes"
			:formatter="function(x) { return x.title }"
			:extracter="function(x) { return x.name }"/>
			
		<n-form-combo label="Operation" v-model="target.repeat.operation" 
			:filter="$services.page.getArrayOperations"
			v-if="target.repeat.type == 'operation'"
			:formatter="function(x) { return x.id }"
			:extracter="function(x) { return x.id }"/>
		<n-form-combo label="Array" v-model="target.repeat.array"
			:filter="function(value) { return $services.page.suggestArray(page, value) }"
			v-else-if="target.repeat.type == 'array'"
			/>
			
		<component v-if="getRepeatConfigurator()" :is="getRepeatConfigurator()" :target="target.repeat" :page="page"/>
			
		<n-form-ace v-model="target.repeat.arrayFilter" label="Filter the array" v-if="target.repeat.array"/>
		<n-form-text v-model="target.repeat.emptyPlaceholder" label="Empty Place Holder"/>
		<n-form-text v-model="target.repeat.loadingPlaceholder" label="Loading Place Holder" v-if="target.repeat.operation"/>
		
		<n-form-switch v-model="target.repeat.enableParameterWatching" label="Watch bound values for change"/>
		<n-form-switch v-model="target.repeat.waitForPageLoad" label="Wait for page rendering to complete"
			after="The repeat will only load data once the full page has been rendered, this makes sure that all filters have finished all calculations"/>
		
		<n-form-switch v-model="target.repeat.enableDrag" label="Enable dragging"/>
		<n-form-text v-model="target.repeat.dragName" label="Drag source name" v-if="target.repeat.enableDrag" placeholder="default"/>
		
		<n-form-switch v-model="target.repeat.selectable" label="Enable item selection"/>
		<n-form-switch v-model="target.repeat.multiSelectable" v-if="target.repeat.selectable" label="Enable multiselect"/>
		<n-form-switch v-model="target.repeat.alwaysMultiselect" v-if="target.repeat.selectable && target.repeat.multiSelectable" label="Multiselect without ctrl/cmd" after="If you enable this switch, multiselection can be done by clicking without the need for holding ctrl/cmd"/>
		<n-form-switch v-model="target.repeat.disableMouseSelection" v-if="target.repeat.selectable" label="Disable mouse selection"/>
			
		<div v-for="(defaultOrderBy, index) in target.repeat.defaultOrderBy" class="has-button-close">
			<div class="is-row">
				<n-form-combo v-model="defaultOrderBy.name" :filter="getOrderByFields" placeholder="Order by field"/>
				<n-form-combo v-model="defaultOrderBy.direction" :items="['asc', 'desc']" placeholder="Direction"/>
			</div>
			<button class="is-button is-variant-close is-size-small is-spacing-horizontal-right-large" @click="target.repeat.defaultOrderBy.splice(index, 1)"><icon name="times"/></button>
		</div>
		<div class="is-row is-align-end" v-if="getOrderByFields()">
			<button @click="target.repeat.defaultOrderBy.push({name: null, direction: 'asc'})" class="is-button is-size-small"><icon name="plus"/><span class="is-title">Order by</span></button>
		</div>
			
		<n-page-mapper v-if="false && target.repeat.operation && operationParameters.length > 0 && Object.keys($services.page.getPageParameters(page)).length" 
			:to="operationParameters"
			:from="{page:$services.page.getPageParameters(page)}" 
			v-model="target.repeat.bindings"/>
	</div>
</template>
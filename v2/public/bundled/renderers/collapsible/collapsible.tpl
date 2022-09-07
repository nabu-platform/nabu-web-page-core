<template id="page-collapsible">
	<div class="is-collapsible" :class="getChildComponentClasses('collapsible')">
		<typography-h3 :page="page" :cell="target" :parameters="parameters" :edit="edit" :child-components="childComponents" @click.native="toggle" class="is-title">
			<icon slot="after" :name="target.collapsible && target.collapsible.iconOpen ? target.state.iconOpen  : 'chevron-down'"></icon>
		</typography-h3>
		<div class="is-collapsible-content" :class="contentClass" v-if="show || edit">
			<slot></slot>
		</div>
	</div>
</template>

<template id="page-collapsible-configure">
	<div>
		<n-form-text v-model="target.collapsible.iconClosed" label="Icon closed" placeholder="chevron-right"/>
		<n-form-text v-model="target.collapsible.iconOpen" label="Icon open" placeholder="chevron-down"/>
		<n-form-switch v-model="target.collapsible.startOpen" label="Start open"/>
		<n-form-switch v-model="target.collapsible.closeSiblings" label="Close siblings"/>
	</div>
</template>
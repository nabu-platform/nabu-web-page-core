<template id="renderer-menu">
	<ul class="is-menu is-variant-toolbar" :class="[{'is-expanded': edit}, getChildComponentClasses('renderer-menu')]" @click="handle">
		<slot></slot>
	</ul>
</template>

<template id="renderer-menu-configure">
	<div>
		<page-event-value :page="page" :container="target.state" title="Handled Event" name="handledEvent" @resetEvents="resetEvents" :inline="true"/>
	</div>
</template>
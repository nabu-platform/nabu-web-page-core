<template id="renderer-table">
	<table class="is-table">
		<thead>
			<slot name="header"></slot>
		</thead>
		<slot></slot>
		<tfoot>
			<slot name="footer"></slot>
		</tfoot>
	</table>
</template>

<template id="renderer-table-configure">
	<div class="is-column is-spacing-vertical-gap-medium">
		
	</div>
</template>
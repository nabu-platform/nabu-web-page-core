<template id="renderer-table">
	<table class="is-table" :class="getChildComponentClasses('table')">
		<thead><slot name="header"></slot></thead>
		<slot></slot>
		<tfoot><slot name="footer"></slot></tfoot>
	</table>
</template>

<template id="renderer-table-body-cell">
	<td :colspan="colspan"><slot></slot></td>
</template>

<template id="renderer-table-header-cell">
	<th :colspan="colspan"><slot></slot></th>
</template>

<template id="renderer-table-configure">
	<div class="is-column is-spacing-vertical-gap-medium">
		
	</div>
</template>

<template id="renderer-table-cell-configure">
	<div class="is-column is-spacing-vertical-gap-medium">
		<n-form-text label="Colspan" v-model="cell.table.colspan"/>
	</div>
</template>


<template id="renderer-table-message">
	<tr>
		<td colspan="100"><slot></slot></td>
	</tr>
</template>
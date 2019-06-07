<template id="n-reveal-page">
	<div class="n-reveal-page" :class="{active: !edit}">
		<slot></slot>
	</div>
</template>

<template id="n-reveal-page-content">
	<div class="n-reveal-page-content" :class="{'reveal': !edit}">
		<div class="slides">
			<slot></slot>
		</div>
	</div>
</template>

<template id="n-reveal-row">
	<section class="n-reveal-row">
		<slot></slot>
	</section>
</template>

<template id="n-reveal-cell">
	<section class="n-reveal-cell">
		<slot></slot>
	</section>
</template>
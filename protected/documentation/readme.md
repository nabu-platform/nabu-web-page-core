# Custom Components

Sometimes you just want to create a custom component.

As an example suppose you want to use page actions but you need a button that has more than an icon and a label. For instance, a subscript.
You could start by switching the label to a HTML and fix it there, or you can create or reuse a custom component which looks like this:

```html
<template id="button-subtext">
	<button class="button-subtext" @click="handle">
		<span :class="icon" class="icon"></span>
		<span class="content">
			<span class="title">{{title}}</span>
			<span class="subscript">{{subscript}}</span>
		</span>
	</button>
</template>
```

And the javascript to declare it:

```javascript
Vue.view("button-subtext", {
	props: {
		icon: {
			type: String,
			required: false
		},
		title: {
			type: String,
			required: true,
		},
		subscript: {
			type: String,
			required: false
		},
		eventName: {
			type: String,
			default: "click"
		}
	},
	methods: {
		handle: function() {
			this.$emit(this.eventName);
		},
		getEvents: function() {
			return this.eventName;
		}
	}
});
```

The ``Vue.view`` method is a wrapper around ``Vue.component`` which does some additional heavy lifting:

- register the component in the router so it can used as an actual route
	- It will correctly expose the props as input parameters in the router
- prevent you from having to type the id multiple times as the component name usually matches the template id

You can also make or reuse a vanilla Vue component and register the component manually.

Some additional notes:

- you can use the standard $emit to emit events that will be sent to page builder
- because page builder requires design time knowledge, you should implement a "getEvents" method (if you are emitting any events) which describes the events you are emitting

If your event has no particular content, you can simply return the name of it, if you have content, you should send a JSON schema-compliant description of the event content.
This allows page builder to expose all the event data at design time and allow you to link it to other parts of your application.

It is often easiest to get a valid JSON Schema definition from the swagger since most data originates from the backend anyway. An example of how a complex event could look:

```javascript
getEvents: function() {
	return {"myEvent": {
		types: "object",
		properties: {
			"something": {
				type: "string"
			},
			"somethingElse": {
				type: "string"
			}
		}
	}};
}
```
# Page

A page has:

- input parameters: input parameters not found in the path are assumed to be query parameters
- rows
- events?

```javascript
page: {
	rows: [],
	parameters: [],
	// prompt popups that are triggered by events
	prompts: // exact same as cells but not positioned in a row, instead in a popup
	actions: // exact same as cells but no visualization, it just performs an action (e.g. delete something)
		// an action can additionally have a message, ok and cancel text which are used for confirmation
		// this can also be used for routing, e.g. an even is triggered by a component and this means we route the entire page (or a part of it) to something else
		// this can only be to another page (or possibly something hardcoded?)
}
```

## Row

A row has:

- cells

```javascript
	rows: [{
		height: "height in pixels of the row",	// width is assumed 100% of parent
		cells: [{}]
	}]
```

## Cell

A cell can contain rows (recursive) or a rendered view (from the router).

A cell has the following structure:

```javascript
{
	id: "a page-wide unique id for this cell to be used for reference (optional)",
	width: "width of the cell in relative flex terms",		// height is assumed 100% of parent
	bindTarget: "you can bind display of this cell to the event in another cell, use the target + event to define this",
	bindEvent: "the event of the cell you are bound to (this also means the cell is invisible until it occurs)",
	parameters: [{
		name: "nameOfParameter",
		type: "typeOfParameter",
		list: "booleanWhetherOrNotList",
		optional: "booleanWhetherOrNotOptional",
		value: "the current value",
		bind: "the name of the page/cell parameter that is bound here",
		eventBind: "whether the bound variable comes from the event or not (alternative is from page)"
	}],
	state: {}	// can be managed by the view itself, it can save state here (e.g. dashboard)
}
```

For a cell with a view, we expect a component to be returned when routing.
The component gets a few default props at creation time:

	- page: the entire page it belongs to
	- cell: the cell it resides in
	- [parameters]: all the parameters are mapped to separate properties by name
		- these can be updated and that should be reflected in the component

This component can have a method "$events" which returns all the events available for the component.

```javascript
function $events()
	return [{
		name: "nameOfEvent",
		parameters:[{
			// list of parameters that comes from the event and which can be bound
			// the event must return the parameters in a single object
		}]
}]
```
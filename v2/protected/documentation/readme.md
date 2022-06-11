# Templates

During template design, the question was:

- do we want template "instances" to keep a "live" link to the original template? This means if we update the original template, all instances immediately reflect the changes
- do we want to copy the full template, allowing fully custom local modifications. updating the template instance is a manual process
- 
The decision was made to make full copies of the templates because it aligns with the nabu philosophy of stability.
Messing with templates should not automatically update potentially ancient applications simply because they have a reference. This might break (too far) down the line before it is noticed.

However, once a template is updated, having to revisit every single instance and pressing "update" is equally annoying, so instead we offer batch modification. You can view (per template that is used in your project) which pages are using them and how up to date they are. You can then do batch updates if you want.
The key factor is that it is a conscious decision to update to the latest template.

## Versions

Templates have versions, you might spend weeks tweaking a particular template before you decide that it is ready for further use. At that point you can "release" it and other instances of the template will be able to update to the new template.
Note that because there is only one instance of the master template, any new instances (currently) get the in-between version, not the final version from the previous release. That would require keeping a copy of that version (which could also be a solution...?)

We do need to keep a copy of the last stable version, we should do this in the root of the template. On dragging, we check for a "stable" version and drag that if possible.
We need to be able to tinker with a template without interrupting people working with them.

Additionally it needs to be visible that a template has changed with regards to its last "stable" release so you know when there are pending changes.

## Copies

A template should be able to deal with the fact that parts of it are duplicated. For instance if your template contains one button, an instance of the template might duplicate that button. Both buttons (unless set up differently) should be in sync with that master button.
This is done by having every cell/row of a template instance reference its counterpart in the master. If you then choose to copy such a "linked" instance, the new instance is also linked. 

We can visually stress this.
This also makes it easy to "decouple" from the master template if you want by simply removing the reference.

## Renumbering

Template instances are renumbered to match the page they are inserted into. However, some components (e.g. button) reference other components by their cell id.
This requires a new specification where components can hook into the renumbering process and update any state as needed.

## Uniqueness

A template has to be uniquely identifiable.
Every cell and row already has an id that is unique within a page. Combine that with the page name which is required to be unique and you have a good identifier.

However, this does limit "movability" of the templates because if you were to copy paste your template to another page, it would be renumbered _and_ belong to another page.
We could add another identifier to the template (e.g. a unique name) and have its own numbering system independent of the cell numbering etc but that boils down to reinventing the wheel.

Currently we will reuse the system of pages+ids, if you want to keep your templates mobile, I suggest wrapping them in their own page rather than combining multiple templates on a single page.

## Showcase

To enable you to create a good showcase for your template, you might want to add content that is not actually part of the template.
Anything inside the template is considered a part unless you specifically check that it is not a part of it. Anything inside something that is not a part of a template can not be made part of the template.
You could theoretically nest templates this way, not sure if that's a good idea.

## Properties

The root of the template is marked with "isTemplate: true"
Any part of the hierarchy that is specifically not a part of the template has "excludeFromTemplate: true"

possilibities:
- visually mark in the tree when a cell/row is linked to a template (use the ref)
- would be cool to "relink" to part of a template, but this might be hard
- you want templates to be usable with the automated operation drag/drop system
	-> maybe you can mark an empty cell/row as receiving a certain "type" of content, for example mark a cell as receiving "form content", at that point it can be included in the form popups
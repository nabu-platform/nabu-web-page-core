- in button -> calculate anchors? instead of hardcoding $blank and $window

- allow for more "error" feedback
	- for example if you configure a button with an action but without a target, this will not do anything at runtime
	- we should be able to flag this as "invalid" so the user can "fix" the page easily

- could do away with content wrapper if we have no rows in the cell? though not very predictable?
	- can add dedicated styling for the content wrapper just in case?
	- this can focus on positioning within the cell

- for filtering, we can probably do "tagging" as a renderer?
	- need to intercept all the @input (and @label! events)
	- can auto tag
	- can offer customization options?


- in typography: allow for "placeholders", so basically type something like
	- this is clean on the translation, people can still put it in different places
	- in the configuration, allow you to configure which field should be bound to that placeholder
-> page fields alternative!

%{My title with {content}}

in typography -> allow for limited rich text? basically all options but not the "block" list? -> can still do coloring, bold,...
and more importantly: can still do links
should add a dedicated option for "internal link"? where you can choose a page to route to (use v-route and compile option)
only add the option if you have compiled turned on?
add slots to the rich text to inject buttons (rich text is unaware of page builder)

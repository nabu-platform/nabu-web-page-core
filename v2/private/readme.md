Actions can be added to run with say a button.
Actions have a defined input and optionally output.
The output can _always_ be returned in a promise (or directly), you must keep that in mind.
If the action has an output, it can not directly be used to bind somewhere, but you _can_ emit an event with it.
Unless of course you are a dedicated component and just writing javascript.

Note that specifications exist to allow components to be hooked up together easily by the user.
For example a paging component might look for components that support the "pageable" specification.

Much like state, the return value from an action "should" be reactive.
For example paging, you can do a get-paging action to get the original paging settings
However, there are a lot of ways that the paging can be updated, someone can click on a "next" button or enable a filter or change the limit etc etc
The component that received the paging object should ideally at every point see the latest data.

This is the same requirement with the state.
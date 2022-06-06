reactiveness:
any state that is exchanged should (as far as possible and necessary) be reactive
this includes state that is exposed and state that is returned


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

TODO:
specifications currently only revolve around actions which means we model some actions just to retrieve state
-> we could however also include state in the specification, as an example the paging component, we use get-paging but could just as well use the state


# Flashing Aris Editor

When you update aris styling, the component gets redrawn. If there is no activate (or it ends immediately), it is rerendered fast enough that vue reuses the component.
Meaning there is no flickering.

If however, you do an asynchronous action, it stays away long enough that it appears as a new component. The consequence is new child components and the aris menu gets redrawn.
This in turn is seriously annoying as it fully collapses every time.

Workaround: in edit mode, always directly call done().
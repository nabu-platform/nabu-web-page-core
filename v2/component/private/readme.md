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

# State in parent and child

A typical scenario is a multitenant situation where you have access to multiple tenants.
In the skeleton of your application you want a "tenant switcher" where you can view all the data for a given tenant.

Suppose you then have a button "customers" for a tenant, you want obviously customers for _that_ tenant.
The customer page has the skeleton as parent and uses parent.customerId (or whatever) to load the customers for _that_ tenant.

There is one massive problem:

Suppose your url is simply "/customer/{customerId}". When you bookmark it and go back, the skeleton does not know which tenant needs to be selected to reflect the customer choice: there is no link between the two that the frontend can discern.

One possibility is that both pages keep state in the url:

/tenant/{tenantId}/customer/{customerId}

Where the /tenant/{tenantId} is the path of the skeleton and the page retains its original path.

This creates another (smaller) problem: the skeleton wants to generate permalinks, but those permalinks are based on the parameters you pass in, so you are required to pass the customer id into the route, simply to generate a correct link.
It would work functionally without that mapping, but the resulting link would be invalid.
This is trivial, just something you mustn't forget.

There is however a bigger issue as well:

Suppose you have a link /tenant/1/customer/a. The skeleton will use the id to get the correct tenant, the page can use the id to get the correct customer. Because of how the application works, it should not generate invalid combinations.
However, if _inside_ the skeleton you change to tenant 2 and customer b there are a number of issues:

- the path in the browser is not updated to reflect this new customer
- the router keeps track of the last rendered path for a skeleton to determine if its state has changed. this is _necessary_ because if we actually routed to /tenant/2/customer/b from _outside_ the skeleton, it _would_ need to reroute the parent.

Currently this can be circumvented with some code like this which is triggered in the skeleton when the id changes. In this example the switcher is on customer and we view per customer:

```javascript
// we use a combo box without a formatter to get the full object, get the id from there
var customerId = $value("page.customer.id");

// we update the browser url so we have a bookmarkable link
$services.vue.updateUrlParameter("customerId", customerId);

// we need to update the renderedUrl cached by the router for the skeleton parent
// this is used to see if we actually update the skeleton parameters
var renderedParent = $services.router.router.parents.filter(function(x) {
	return x.alias == "skeleton";
})[0];
renderedParent.renderedUrl = $services.router.router.template("skeleton", {customerId:customerId});
```

Initially we also updated the page "parameters" object but this is not strictly needed unless you actually use that value. It will become stale if you don't update it

```javascript
// update the customer id in the page parameters
// this is because we use it for bindings
$value("page.$this").set("page.customerId", $value("page.customer.id"))
```

We should check how we can create something reusable from this.
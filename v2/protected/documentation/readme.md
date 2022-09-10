# Changes

## Globalized state

Instead of state being encapsulated in components (e.g. data.js, form engine,...) everything is exposed at the global level.
This allows you to for instance modify directly the state of a form or read from it.

## Component decapsulation

In v1, there were a number of "large" components that encapsulated a lot of logic. for instance a data.js component did filtering, paging, data management, titles, buttons,... they were "easy" to use but inflexible to create truly arbitrary applications. The component page-arbitrary tried to add some flexibility but was not always predictable state-wise and had other issues.

Data cards with embedded pages was the "default" go-to to create lists.

For instance creating complex filters for data objects was very hard without just writing a dedicated solution. Complex wizards used a combination of multiple forms on a single page together with (eternally buggy) page-based forms.
Tables were very limited in how headers were set up (colspans, filters in headers,...) and things like an additional footer with a "total" for invoices etc.
Adding complex content (inline graphs etc) was done with page arbitrary which again had other issues.
Accessing state from the table (or any data component) had to be done with events. Etc.

If you want a subtitle on your data component...tough luck.
If you wanted more variable layout for your page actions, you had to combine multiple page actions.

CSS could be used to "fix" a number of these issues, but sometimes even that was not enough.

Additionally in v1, because you had a smaller number of "large" components, they had equally large configuration, requiring you to sometimes dig deep into a configuration subset to find a particular thing.

In v2, all these concerns are split up, for example the form "engine" no longer has a "submit" button, instead you can add it however and wherever you want.
The data js component no longer provides filtering out of the box nor tagging or paging. These are all separate components now that can be plugged in in any combination that is needed.

This allows you to use the full power of the grid-based page builder to build your solution, rather than trying to shoehorn an existing component into a particular layout with very aggressive css (and even then sometimes failing).

This does mean building the end result will require more components, but generators and templates can be used to automate common usecases.

## Renderers

There are still concerns that need to be managed cross component. For instance if you have a form that should call an operation, you want to collect all the state into a single resultset that can be sent in one go to the backend.
But on the other hand, you want to use the full power of page builder to layout your form however you wish.

In v1, there was already the concept of a "renderer" where you could choose to render your row or cell with something else than a plain "div". This can for instance be used to implement foundation emails by switching out the divs with tables.
It was also used in a testcase for an image slider where a row renderer would cycle through the cells rather than display them all.

But in the end, the renderers in v1 were barely used and underpowered.

In v2 we have taken this concept and taken it to the next level. Renderers can be set on rows and cells and within them you can use the full power of page builder to build more rows and cells to get exactly the layout you want.
The renderer can then do whatever it wants to actually visualize this grid.

For example the repeat renderer will display the same content multiple times with different state.
The form renderer is more lightweight from a frontend perspective and simply wraps a "<form>" tag around everything else. But on the javascript side of things, it does a ton more like state management.

## Actions

In v1, everything was coupled together via events. If a button wanted to trigger a REST call, it had to emit an event and a page trigger would subscribe to it to do the REST call.
While events are a good tool for 1-* subscriptions, they make it harder to understand 1-1 interactions which are more often used.

In v2, components can expose "actions". This allows a button for instance to call a "submit" action on a form. Together with the globalized state, this exposes components in a way that was not possible in v1.
For example a form might expose a "submit" action. A button can then be added to the page that simply calls that submit action directly on the form component. This bypasses events completely.

## Specifications

Actions and state can be combined into specifications where for instance the "repeat" might implement the "pageable" specification which can be used by any component that is somehow pageable.
The paging component can be coupled to any component that implements this specification.

This approach allows not only for direct coupling rather than indirect eventing but it also allows for autodiscovery to make contextual suggestions.

## Templates

Templates already existed in v1, but in v2 they have gotten a massive upgrade.
The templates as they existed in v1 are still supported and used, but a whole different type of template has been added. You can now template parts of a page in your application (or a shared repository).
If you add a copy of the template to your pages in other locations, you can make local modifications but (as far as possible), it retains a component-by-component link to the original template. 
The original template can be updated and released with a new version at which point other instances of the template can optionally receive an update.

This allows for centralized management of recurring usecases within an application or set of applications with the ability to evolve those templates as time goes on.

## Style

In page builder v1 we mostly used plato to style our applications. However, this was fully separate from page builder. In v1 there was some light css scraping that tried to perform some autosuggestions but most of the time it required knowledgeable style gurus to make everything work correctly.
Sometimes weird combinations of classes in just the right position had to be used to get a particular desired effect. Other developers were afraid to touch anything because they might break it. This sometimes ended in massive copy pasting with nasty work arounds.

The v2 release of page builder actually started with aris, the new styling framework. Because of possibilities that aris offered that weren't available before, the encapsulation of v1 components was a major downside because it prevented full use of the power of aris.
The styling framework is written from the ground up to be "easy" to understand (no complex scss going on), with simple predictable selectors that had predictable overriding. 
And most importantly, aris was written specifically to be inspectable by page builder so it could offer up suggestions and finally work towards a theme builder.

Because of these changes to how styling works, the style section available in v1 where you could write scss in the frontend has been removed in v2.

## Functions

Functions are a useful construct, mostly for components to add logic to the application (e.g. the CMS with the login function).
In v1 you could also add functions from the frontend, but this was rarely used. Over time page builder also added better support for executing javascript in the page which was often enough to solve the minor issues where the javascript was needed.

In v2 I have decided to remove the frontend function editing part but will obviously retain functions as a concept.
If you still need to add a function, you can always add one in javascript as the other modules do.
And if the usecase is big enough, frontend function editing might be reintroduced, but even if it is, it will be in a separate opt-in module and not distributed in the page core.

## Typography

Page fields in v1 was used in a lot of places as it allowed the user to write complex combinations of copy and variables with full dropdown capabilities (so no need to guess variable names etc).
However, there was often a lot of click work involved in opening and closing everything to edit it. Understanding what was there again required a lot of clicking.

I think page fields is probably THE most complained about component in v1. So I'm happy to report it is fully deprecated in v2.

Instead v2 comes with inline editing capabilities (using content editable) where you can use placeholders to denote variable positions. These variables can be bound in the same way as was available in v1, allowing for the same advantages.
This combines the best of all worlds, not only is it a ton easier to understand and modify what there is, the translations are also a lot cleaner now.

## Triggerable

In v1, some logic was "duplicated" (sometimes only partially). For instance page-actions could do _some_ of the stuff of page triggers but not everything. If you wanted to call a rest service, page actions had to emit an event that could be used by a page trigger.
But routing could be done directly in the button. And at the page level. With different codebases that were manually kept in sync.
Spread throughout page builder were "click" events, some available on cells or fragments or... These were usually late additions that did not follow a common theme.

In v2, these instances are replaced with a central concept of "triggerable".
Not only does it centralize all the logic in one place that can be easily reused, it adds a few neat tricks of its own.

No longer can you do just one action, you can chain them together. In fact you can have multiple chains.
These chains are linked together by promises, guaranteeing correct execution and will keep internal state when relevant. For instance if you perform a rest call, you can capture the return value in a variable that exists only inside the triggerable and can be used to map to the next step in the action chain.
Of course, global state is a primary motivation of v2 so triggers can obviously expose this state as well, though currently this exchange is done through events.

## Speed

The configuration get in v1 was generally slow after a reboot. Caching kicked in to make subsequent calls much faster, but it still provided a bottleneck.
This bottleneck was down to two issues:

- page builder tried to load SPECIFIC translations. so it scraped all the pages for translatable content and translated it, this could easily take 5-10s without a cache
- page builder wants to tell the frontend about active features. however, it does this by calling the service that lists ALL features, including the disabled. calculating all the disabled features requires a ton of I/O overhead because a lot of files that are not yet in memory need to be scraped in order to figure out all the features. this call has been known to last over a minute in extreme cases.

### Translations

For translations it was decided that these generally do not contain "state secrets" so it is (in general) OK to just stream all available translations for a particular language to the frontend. This makes it one select instead of hundreds.
NOTE: this does not work well with operational translations! Need ability to ignore those.

Page builder will also no longer have a backend-link to any translation provider. Instead it will look in the frontend for a translation service. Not only does this further decouple the backend (e.g. with specs and implementations as was the case in v1), but it allows the user to more easily plug in a custom variant of the translation service to provide a different kind of translation.

Together with another optimization done the page loop, this brought a particular example of load time for common configuration down from 4.9s to 280ms.

### Features

Calculating active features can be done much easier because only a very limited set of artifacts can change the state of a feature from disabled to enabled.
The overhead of calculting all the features is still necessary for edit mode, but this can be done asynchronously, only for editors, rather than for everyone.


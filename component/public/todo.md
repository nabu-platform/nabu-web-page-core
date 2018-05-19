# TODO

- synchronize changes werkt niet meer?
- page-fields: add form support
- toggle form fields on events (e.g. in table, toggle form fields for a row, in page fields for the entire bit)

## Longterm

### Wizards

- CRUD wizard voor data: automatisch genereren events, formulieren...
- grid layout suggestion

### Validation

- tonen als er bv. velden niet meer bestaan bij data binding, form binding,...





add swagger caching
	> can toggle this per service (to cache or not to cache)
	> can perhaps add an event per service to reset a cache?
	> use websockets to refreshes
		> in GET webservices (mostly): add ability to set dependencies: which services can impact whether or not its cache needs to be reset
		> also set dependencies from the PUT/POST/DELETE perspective? (can add any service at any point...)
		> suppose we call service1, check all dependencies and send (via websockets):
			hash of the operation id to be reset (service2, service3,...)
			hash of the uuid parameters that were used in the path of the service1 call
				generally this contains an identifier
			can automatically reset the cache for that particular instance in frontend
		can toggle ability to actively refresh the cache (do call immediately, merge result set...)
	
add full crud support for non-paged tables
	delete: by reference (or worst case by key?)
	create: push result instead of refresh
	update: heeft al gesynchroniseerde

page field: velden formatteren als switch (niet editable)

make form fully pluggable

add card component

add table-list component (same as card component?)

bekijken of tabel ook gevoed kan worden van bestaande array (ipv rest call)

add services? placeholders of data cross-page (push definitions of state down from the page level)
	allow actual initial state to be built?
	allow pushing of events through a service, can communicate between pages (e.g. multi-page wizard)

--------------

- allow images to be dropped in resources folder (for static images)
	> have a tiny gallery of images available in the folder (and deletability)


- switch from eval() to function (see mdn for eval entry)
--------------

page builder as form input option (lightweight!)

row styling that makes it a table
	> aponet
	> with each cell a field
need simple "actions"? (as fragment) (tabs > maybe rename to "actions"?)
	> part of fields?
		> can send out any (complex) part of state
need icon stuff in fields (as fragment)

add "description" to form fields which allows (in small) to add a description to a field, explaining for example the password policy
	> can alternatively do this as an n-info?
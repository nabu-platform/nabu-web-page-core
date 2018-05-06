pages on file system!!!!

can remove dependency on cms?
	> web application configuration data should be in an actual config?
	> config instance with key/value pairs in it (environment-specific)
		> can modify during deployment
	> better: add it to the web application config itself (not a separate instance!)
-> ability to add arbitrary documents to a web application (not used in rest services...)
	
web application is currently an instance in db, idea is to add stuff to it like images
	> however, this can be a concern of the cms image uploader, not the page builder...

--------------

page builder as form input option (lightweight!)
rich text as form input

form input that triggers "on change" > can make it part of a table

V condition renders on cells (e.g. only render something if the state has some value)

V centralize condition resolution, need to switch from eval() to function asap

row styling that makes it a table
	> aponet
	> with each cell a field
need simple "actions"? (as fragment) (tabs > maybe rename to "actions"?)
	> part of fields?
		> can send out any (complex) part of state
need icon stuff in fields (as fragment)

add "description" to form fields which allows (in small) to add a description to a field, explaining for example the password policy
	> can alternatively do this as an n-info?
The problem is that we want to decouple the page builder from user management as much as possible.
However we need to know whether you have edit permission.

So first we check if you have the role "editor" which is configured on the rest services.
If that returns true, you either have the role or no role handler is configured.
To be sure we check permission as well, normally only a permission handler _or_ a role handler is configured.

So again, either you have the permission or it is not configured.

Only in the case that both handlers are configured and the system is not properly configured will this fail.
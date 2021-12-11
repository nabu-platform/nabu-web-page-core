# Page Builder State

There are a number of ways a page can build up state.

## Default values

When defining an internal parameter, we can set a default parameter and (optionally) reset listeners to reset to the default value.

The question is: when is the default value calculated?

On page create (_before_ the external state is calculated), the defaults will be set. This allows you to use the internal parameters (and their default values) when building up initial state from an external source.
However, some variables _need_ the external source to calculate a correct default. For that reason, default values are _recalculated_ after the initial state is done.

The only exception to this rule, is if you _set_ a variable with __the same name__ during the initial state.

We use this trick (a variable with the same name in external and internal state) to get the best of both worlds: external state to perform calls etc, internal state for default value, value listeners etc.
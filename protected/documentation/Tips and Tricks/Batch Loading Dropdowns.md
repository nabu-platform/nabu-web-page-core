@tags combobox, combo, form

# Combo box batch

It does not happen very often that you have a "batch" of combo boxes, one of the few usecases is inline editing in a repeatable data structure like a table.

Suppose you have a table where you have a value that is a uuid. You want to however show a correctly translated version inline, there are a number of options:

- if it is masterdata, you can choose the "masterdata" resolving, which will use preloading or smart batch loading
- resolve: a generic resolving methodology that uses the same smart batch principles as masterdata and frontend caching to reduce load
- backend resolve: you can of course also resolve the field in the backend, especially using CRUD this can be a very simple option

If however you want to also inline-edit that field with a combo box, things becomes a bit trickier.

If you simply use "enumeration-operation", this will call the backend for every combo box entry, the behavior you end up with is:

[^.resources/combo-slow-load.mp4]

If you look at the network tab of your browser, things look even worse:

[:.resources/combo-slow-network.jpeg]

Alternatively however, you can load all the relevant data (assuming it is somewhat limited) into the state of the page as an external state.
Then inline, you can use the "enumeration-array" option. This results in instant resolving with only a single network call:

[^.resources/combo-fast-load.mp4]
Everything works when we put v-route-render on the cell itself _except_ nested rows.
There is no clean way to retain the nested rows in combination with route-render.


We can mark the rows as "unclearable", then update the element clear (in utils.dom):

	clear: function(element) {
		var nodes = element.querySelectorAll(":scope > :not([unclearable])");
		nodes.forEach(function(node) {
			element.removeChild(node);
		})
	},

note that the :scope selector used here does not work in IE

That will leave in the grid, but then the actual content is _after_ the rows in general cause it is appended
We would need to update the appending logic for the renderer to append before any unclearable, with the implication that unclearable can only be at the end
maybe we can add another toggle to remedy that

but the render will also automatically destroy all vms etc, so this requires quite a retrofit
we could easily skip destruction of unclearable elements, but at some point they _do_ have to be destroyed
we could for example not destroy when we are clearing the element itself, but nested unclearable elements _are_ destroyed

we also destroy the vm at the element level itself. if we route directly into the cell content itself though, and you set a cell renderer with its own vm logic
we might destroy stuff that should not be destroyed

initially the primary reason to do it was to get a html structure that resembled the menu
however, after all this, it is still not compatible, we get this in simple cases:

<ul>
	<div class="is-page-column"><button></button></div>
</ul>


which looks awesome but when we add nested rows, we get:

<ul>
	<div class="is-page-column">
		<button></button>	
		<div class="is-grid">
			<div class="is-page-row">
				<div class="is-page-column">
					<button></button>
				</div>
			</div>
		</div>
	</div>
</ul>


which is still not exactly what we need because there is a superfluous "is-grid" level in between there

at that point we would need to split off a singular row into a separate component and differentiate between the usecases where we only have one child row in a cell (which is often the case)
or multiple

_then_ we would finally have something that approaches the same html structure as you would type.

added benefit if we split off row and cell into separate components is that we can more easily support putting the whole cell (including the wrapper) into a popup/sidebar rather than as currently the case: only the content

all in all, currently the benefits (cleaner html) do not outweigh all the potential risks

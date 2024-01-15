Vue.service("testIdentifier", {
	services: ["page", "swagger"],
	data: function() {
		return {
			// whether or not you are inspecting
			inspecting: false,
			// show everything, otherwise we limit to "interesting" stuff
			deep: false,
			lastElement: null
		}
	},
	activate: function(done) {
		// if you can test, enable the identifier
		if (this.$services.page.testable) {
			this.registerListeners();
		}
		done();
	},
	methods: {
		registerListeners: function() {
			var self = this;
			document.addEventListener("keydown", function(event) {
				if (event.key && event.key.toLowerCase() == "i" && event.altKey) {
					console.log("toggline inspection");
					self.inspecting = !self.inspecting;
				}
			});
			document.addEventListener("mouseover", function(event) {
				if (self.inspecting) {
					self.inspect(event.target, event.x, event.y);
				}
			});
		},
		calculateIdentifier: function(element) {
			// if we have an id, that's it!
			if (element.hasAttribute("id")) {
				return "#" + element.getAttribute("id");
			}
			else if (element.hasAttribute("name")) {
				return "[name=\"" + element.getAttribute("name") + "\"]";
			}
			// we take the parent and the tag name + offset
			else {
				// it is 1-based
				var index = 1;
				var sibling = element.previousElementSibling;
				while (sibling) {
					if (sibling.tagName == element.tagName) {
						index++;
					}
					sibling = sibling.previousElementSibling;
				}
				var path = element.tagName.toLowerCase() + ":nth-child(" + index + ")";
				if (element.parentNode) {
					path = this.calculateIdentifier(element.parentNode) + " > " + path;
				}
				return path;
			}
		},
		inspect: function(element, x, y) {
			// make sure we don't trigger multiple times on the same element
			if (element != this.lastElement) {
				this.lastElement = element;
				var div = document.getElementById("element-inspector");
				if (div) {
					if (div.contains(element)) {
						return null;
					}
					div.parentNode.removeChild(div);
				}
				div = document.createElement("div");
				div.setAttribute("id", "element-inspector");
				
				var self = this;
				var interestingElements = ["button", "a", "input", "textarea"];
				while (element) {
					var interesting = element.tagName && interestingElements.indexOf(element.tagName.toLowerCase()) >= 0;
					if (interesting || self.deep) {
						var child = document.createElement("div");
						child.setAttribute("class", "element-inspection");
						div.appendChild(child);
						
						var tag = document.createElement("span");
						tag.setAttribute("class", "element-tag");
						tag.innerHTML = element.tagName.toLowerCase();
						child.appendChild(tag);
						
						var identifier = document.createElement("span");
						identifier.setAttribute("class", "element-identifier");
						identifier.innerHTML = self.calculateIdentifier(element);
						child.appendChild(identifier);
					}
					element = element.parentNode;
				}
				
				if (div.childNodes.length) {
					div.setAttribute("style", "left:" + x + "px;top:" + (y + 1) + "px");
					document.body.appendChild(div);
				}
			}
		}
	}
});
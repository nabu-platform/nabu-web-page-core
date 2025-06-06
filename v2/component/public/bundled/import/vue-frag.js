
// source located at: https://github.com/privatenumber/vue-frag
// compiled located at: https://unpkg.com/vue-frag@1.4.3/dist/frag.js
// compiled is missing explicit directive and component declartions (added at bottom here)
(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, 
    global.Frag = factory());
})(this, (function() {
    "use strict";
    var $placeholder = Symbol();
    var $fakeParent = Symbol();
    var $nextSiblingPatched = Symbol();
    var $childNodesPatched = Symbol();
    var isFrag = function isFrag(node) {
        return "frag" in node;
    };
    var parentNodeDescriptor = {
        get: function get() {
            return this[$fakeParent] || this.parentElement;
        },
        configurable: true
    };
    var patchParentNode = function patchParentNode(node, fakeParent) {
        if ($fakeParent in node) {
            return;
        }
        node[$fakeParent] = fakeParent;
        Object.defineProperty(node, "parentNode", parentNodeDescriptor);
    };
    var nextSiblingDescriptor = {
        get: function get() {
            var childNodes = this.parentNode.childNodes;
            var index = childNodes.indexOf(this);
            if (index > -1) {
                return childNodes[index + 1] || null;
            }
            return null;
        }
    };
    var patchNextSibling = function patchNextSibling(node) {
        if ($nextSiblingPatched in node) {
            return;
        }
        node[$nextSiblingPatched] = true;
        Object.defineProperty(node, "nextSibling", nextSiblingDescriptor);
    };
    var getTopFragment = function getTopFragment(node, fromParent) {
        while (node.parentNode !== fromParent) {
            var _node = node, parentNode = _node.parentNode;
            if (parentNode) {
                node = parentNode;
            }
        }
        return node;
    };
    var getChildNodes;
    var getChildNodesWithFragments = function getChildNodesWithFragments(node) {
        if (!getChildNodes) {
            var _childNodesDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "childNodes");
            getChildNodes = _childNodesDescriptor.get;
        }
        var realChildNodes = getChildNodes.apply(node);
        var childNodes = Array.from(realChildNodes).map((function(childNode) {
            return getTopFragment(childNode, node);
        }));
        return childNodes.filter((function(childNode, index) {
            return childNode !== childNodes[index - 1];
        }));
    };
    var childNodesDescriptor = {
        get: function get() {
            return this.frag || getChildNodesWithFragments(this);
        }
    };
    var firstChildDescriptor = {
        get: function get() {
            return this.childNodes[0] || null;
        }
    };
    function hasChildNodes() {
        return this.childNodes.length > 0;
    }
    var patchChildNodes = function patchChildNodes(node) {
        if ($childNodesPatched in node) {
            return;
        }
        node[$childNodesPatched] = true;
        Object.defineProperties(node, {
            childNodes: childNodesDescriptor,
            firstChild: firstChildDescriptor
        });
        node.hasChildNodes = hasChildNodes;
    };
    function before() {
        var _this$frag$;
        (_this$frag$ = this.frag[0]).before.apply(_this$frag$, arguments);
    }
    function remove() {
        var frag = this.frag;
        var removed = frag.splice(0, frag.length);
        removed.forEach((function(node) {
            node.remove();
        }));
    }
    var getFragmentLeafNodes = function getFragmentLeafNodes(children) {
        var _Array$prototype;
        return (_Array$prototype = Array.prototype).concat.apply(_Array$prototype, children.map((function(childNode) {
            return isFrag(childNode) ? getFragmentLeafNodes(childNode.frag) : childNode;
        })));
    };
    var addPlaceholder = function addPlaceholder(node, insertBeforeNode) {
        var placeholder = node[$placeholder];
        insertBeforeNode.before(placeholder);
        patchParentNode(placeholder, node);
        node.frag.unshift(placeholder);
    };
    function removeChild(node) {
        if (isFrag(this)) {
            var hasChildInFragment = this.frag.indexOf(node);
            if (hasChildInFragment > -1) {
                var _this$frag$splice = this.frag.splice(hasChildInFragment, 1), removedNode = _this$frag$splice[0];
                if (this.frag.length === 0) {
                    addPlaceholder(this, removedNode);
                }
                node.remove();
            }
        } else {
            var children = getChildNodesWithFragments(this);
            var hasChild = children.indexOf(node);
            if (hasChild > -1) {
                node.remove();
            }
        }
        return node;
    }
    function insertBefore(insertNode, insertBeforeNode) {
        var _this = this;
        var insertNodes = insertNode.frag || [ insertNode ];
        
        // CUSTOM PATCH: by default "adding" children to something that is already rendered will result in randomized order
        // this prevents the randomized ordering:
		var isAlreadyInserted = insertNodes.every(function(n) {
			return n[$fakeParent] === _this;
		});
		if (isAlreadyInserted) {
			insertNodes.forEach(function(node) {
				if (node !== insertBeforeNode) {
					_this.removeChild(node);
				}
			});
		}
		// end custom patch
        
        if (isFrag(this)) {
        	// DISABLED FOR CUSTOM PATCH
            //if (insertNode[$fakeParent] === this && insertNode.parentElement) {
            //    return insertNode;
            //}
            var _frag = this.frag;
            if (insertBeforeNode) {
                var index = _frag.indexOf(insertBeforeNode);
                if (index > -1) {
                    _frag.splice.apply(_frag, [ index, 0 ].concat(insertNodes));
                    insertBeforeNode.before.apply(insertBeforeNode, insertNodes);
                }
            } else {
                var _lastNode = _frag[_frag.length - 1];
                _frag.push.apply(_frag, insertNodes);
                _lastNode.after.apply(_lastNode, insertNodes);
            }
            removePlaceholder(this);
        } else if (insertBeforeNode) {
            if (this.childNodes.includes(insertBeforeNode)) {
                insertBeforeNode.before.apply(insertBeforeNode, insertNodes);
            }
        } else {
            this.append.apply(this, insertNodes);
        }
        insertNodes.forEach((function(node) {
            patchParentNode(node, _this);
        }));
        var lastNode = insertNodes[insertNodes.length - 1];
        patchNextSibling(lastNode);
        return insertNode;
    }
    function appendChild(node) {
        if (node[$fakeParent] === this && node.parentElement) {
            return node;
        }
        var frag = this.frag;
        var lastChild = frag[frag.length - 1];
        lastChild.after(node);
        patchParentNode(node, this);
        removePlaceholder(this);
        frag.push(node);
        return node;
    }
    var removePlaceholder = function removePlaceholder(node) {
        var placeholder = node[$placeholder];
        if (node.frag[0] === placeholder) {
            node.frag.shift();
            placeholder.remove();
        }
    };
    var innerHTMLDescriptor = {
        set: function set(htmlString) {
            var _this2 = this;
            if (this.frag[0] !== this[$placeholder]) {
                this.frag.slice().forEach((function(child) {
                    return _this2.removeChild(child);
                }));
            }
            if (htmlString) {
                var domify = document.createElement("div");
                domify.innerHTML = htmlString;
                Array.from(domify.childNodes).forEach((function(node) {
                    _this2.appendChild(node);
                }));
            }
        },
        get: function get() {
            return "";
        }
    };
    var frag = {
        inserted: function inserted(element) {
            var parentNode = element.parentNode, nextSibling = element.nextSibling, previousSibling = element.previousSibling;
            var childNodes = Array.from(element.childNodes);
            var placeholder = document.createComment("");
            if (childNodes.length === 0) {
                childNodes.push(placeholder);
            }
            element.frag = childNodes;
            element[$placeholder] = placeholder;
            var fragment = document.createDocumentFragment();
            fragment.append.apply(fragment, getFragmentLeafNodes(childNodes));
            element.replaceWith(fragment);
            childNodes.forEach((function(node) {
                patchParentNode(node, element);
                patchNextSibling(node);
            }));
            patchChildNodes(element);
            Object.assign(element, {
                remove: remove,
                appendChild: appendChild,
                insertBefore: insertBefore,
                removeChild: removeChild,
                before: before
            });
            Object.defineProperty(element, "innerHTML", innerHTMLDescriptor);
            if (parentNode) {
                Object.assign(parentNode, {
                    removeChild: removeChild,
                    insertBefore: insertBefore
                });
                patchParentNode(element, parentNode);
                patchChildNodes(parentNode);
            }
            if (nextSibling) {
                patchNextSibling(element);
            }
            if (previousSibling) {
                patchNextSibling(previousSibling);
            }
        },
        unbind: function unbind(element) {
            element.remove();
        }
    };
    var Fragment = {
        name: "Fragment",
        directives: {
            frag: frag
        },
        render: function render(h) {
            return h("div", {
                directives: [ {
                    name: "frag"
                } ]
            }, this.$slots["default"]);
        }
    };
    frag.Fragment = Fragment;
    return frag;
}));



Vue.directive('fragment', Frag);
//Vue.component('fragment', Frag);






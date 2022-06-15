// TODO: add support for calling operations
// TODO: add support for executing arbitrary javascript
// TODO: add support for resetting events (though this might be an action on the page itself?)


Vue.service("triggerable", {
	methods: {
		// get all the events that can occur from these triggers
		getEvents: function(target) {
			var result = {};
			if (target.triggers) {
				target.triggers.forEach(function(trigger) {
					trigger.actions.forEach(function(action) {
						if (nabu.page.event.getName(action, "event") && nabu.page.event.getName(action, "event") != "$close") {
							var type = nabu.page.event.getType(action, "event");
							result[nabu.page.event.getName(action, "event")] = type;
						}
					})
				});
			}
			return result;
		},
		// the target we want to trigger on (cell, row,..)
		// the name of the trigger (e.g. click)
		// any value we received for the trigger, for instance an action or event might have data attached to it
		trigger: function(target, trigger, value, instance) {
			// we don't always call this handler (immediately), so we separate the logic
			var self = this;
			
			// TODO: the name "triggers" is actually configurable
			var triggers = target.triggers.filter(function(x) {
				return x.trigger == trigger
					&& (!x.condition || self.$services.page.isCondition(x.condition, value, instance));
			});
			
			var promises = triggers.map(function(x) {
				var actions = x.actions.filter(function(y) {
					return !y.condition || self.$services.page.isCondition(y.condition, value, instance);
				});
				
				// we start a new promise for the full trigger
				var triggerPromise = self.$services.q.defer();
				
				// actions can be immediately run or chained
				var runAction = function(index, lastPromise) {
					var action = actions[index];
					
					var getBindings = function() {
						var parameters = {};
						var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
						console.log("bindings for", action);
						Object.keys(action.bindings).map(function(key) {
							if (action.bindings[key] != null) {
								var value = self.$services.page.getBindingValue(pageInstance, action.bindings[key], instance);
								if (value != null) {
									parameters[key] = value;
								}
							}
						});
						return parameters;
					}
					
					var handler = function() {
						// event-based
						if (nabu.page.event.getName(action, "event")) {
							var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
							return pageInstance.emit(
								nabu.page.event.getName(action, "event"),
								nabu.page.event.getInstance(action, "event", instance.page, instance)
							);
						}
						// route based
						else if (action.route) {
							var route = action.route;
							// variable route possible
							if (route.charAt(0) == "=") {
								route = self.$services.page.interpret(route, instance);
							}
							var parameters = getBindings();
							if (action.anchor == "$blank") {
								window.open(self.$services.router.template(route, parameters));
							}
							else if (action.anchor == "$window") {
								window.location = self.$services.router.template(route, parameters);
							}
							else {
								return self.$services.router.route(route, parameters, action.anchor, action.mask);
							}
						}
						else if (action.url) {
							var url = self.$services.page.interpret(action.url, instance);
							if (action.anchor == "$blank") {
								window.open(url);
							}
							else {
								window.location = url;
							}
						}
						// we might want to run an action
						else if (action.action) {
							if (action.actionTarget) {
								var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
								var target = self.$services.page.getActionTarget(pageInstance, action.actionTarget);
								// at this point it is a renderer or a component
								if (target && target.runAction) {
									var result = target.runAction(action.action, getBindings());
									var promise = self.$services.q.defer();
									// if we want to emit an action event, let's, even if the result is null
									if (action.actionEvent) {
										if (result && result.then) {
											// we don't do anything (yet) on error?
											result.then(function(x) {
												pageInstance.emit(action.actionEvent, x);
												promise.resolve();
											}, promise);
										}
										else {
											pageInstance.emit(action.actionEvent, result).then(promise, promise);
										}
									}
									else {
										promise.resolve();
									}
									return promise;
								}
							}
						}
					};
					
					if (!self.edit) {
						var runNext = function(promise) {
							// we finished!
							if (index == actions.length - 1) {
								// if we passed in a promise, wait for it to finish
								if (promise) {
									promise.then(triggerPromise, triggerPromise);
								}
								else {
									triggerPromise.resolve();
								}
							}
							else {
								runAction(index + 1, promise);
							}
						};
						
						var result = handler();
						
						// we don't want to chain it, immediately execute
						if (!lastPromise || action.immediate) {
							// if we returned a promise, we want to keep in mind when running following actions
							if (result.then) {
								// if we have a lastpromise and we are in immediate mode, we are actually in parallel
								if (lastPromise && action.immediate) {
									lastPromise = self.$services.q.all(lastPromise, result);
								}
								// otherwise we just want the current promise
								else {
									lastPromise = result;
								}
							}
							// if we don't have a promise, we just keep the last one
							// anyway, start the next one
							runNext(lastPromise);
						}
						else {
							runNext(result.then ? result : lastPromise);
						}
					}
				};
				
				// start at the beginning
				if (actions.length > 0) {
					// if we want confirmation and you reject, we don't start
					if (x.confirmation) {
						self.$confirm({message:self.$services.page.translate(self.$services.page.interpret(x.confirmation, instance))}).then(function() {
							runAction(0);
						}, triggerPromise);
					}
					else {
						runAction(0);
					}
				}
				// nothing happened, resolve immediately
				else {
					triggerPromise.resolve();
				}
				
				return triggerPromise;
			});
			
			return this.$services.q.all(promises);
		}
	}
});

Vue.component("page-triggerable-configure", {
	template: "#page-triggerable-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		// where we can store our triggers
		target: {
			type: Object,
			required: true
		},
		// the available triggers, the key is the name, the value is the data type
		// to be interesting you need at least one trigger
		triggers: {
			type: Object,
			required: true
		},
		// the name of the field within the target that we can store it
		name: {
			type: String,
			default: "triggers"
		}
	},
	created: function() {
		// normalize
		if (!this.target[this.name]) {
			Vue.set(this.target, this.name, []);
		}
	},
	methods: {
		actionUp: function(trigger, action) {
			var index = trigger.actions.indexOf(action);	
			if (index > 0) {
				trigger.actions.splice(index, 1);
				trigger.actions.splice(index - 1, 0, action);
			}
		},
		actionDown: function(trigger, action) {
			var index = trigger.actions.indexOf(action);	
			if (index < trigger.actions.length - 1) {
				trigger.actions.splice(index, 1);
				trigger.actions.splice(index + 1, 0, action);
			}
		},
		addAction: function(target) {
			var action = {
				// the event to send
				event: null,
				// redirect to url
				url: null,
				// call an action on another object
				action: null,
				actionTarget: null,
				// emit an event once an action is done
				actionEvent: null,
				// route to redirect to
				route: null,
				// whether or not to mask
				mask: null,
				// the anchor to route in
				anchor: null,
				// other active routes
				activeRoutes: [],
				// possible bindings
				bindings: {}
			};
			target.actions.push(action);
		},
		addTrigger: function() {
			var trigger = {
				actions: []
			};
			var triggerNames = this.getTriggerNames();
			// if there is only one trigger, we start on that
			if (triggerNames.length == 1) {
				trigger.trigger = triggerNames[0];
			}
			this.target[this.name].push(trigger);
		},
		// get available trigger names
		getTriggerNames: function(value) {
			var result = Object.keys(this.triggers);
			if (value) {
				result = result.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0});
			}
			result.sort();
			return result;
		}	
	}
})
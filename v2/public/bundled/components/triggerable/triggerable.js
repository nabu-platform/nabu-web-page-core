// TODO: add support for calling operations
// TODO: add support for executing arbitrary javascript
// TODO: add support for resetting events (though this might be an action on the page itself?)

// TODO: de confirmation moet een eigen actie zijn!
// kan zijn dat je iets wilt doen, dan confirmatie voor een volgende actie


Vue.service("triggerable", {
	methods: {
		getActiveRoutes: function(target) {
			var routes = [];
			if (target.triggers) {
				target.triggers.forEach(function(trigger) {
					if (trigger.actions) {
						trigger.actions.forEach(function(action) {
							if (action.type == "route") {
								// must not be a rule
								if (action.route && action.route.indexOf("=") != 0) {
									routes.push(action.route);
								}
								if (action.activeRoutes) {
									nabu.utils.arrays.merge(routes, action.activeRoutes);
								}
							}
						})
					}
				})
			}
			return routes;
		},
		getInternalState: function(page, trigger, action) {
			var result = {};
			// depending on where you are in the action chain, you may have additional state
			var pageInstance = this.$services.page.getPageInstance(page);
			var index = action ? trigger.actions.indexOf(action) : trigger.actions.length;
			for (var i = 0; i < index; i++) {
				var before = trigger.actions[i];
				// we have explicitly saved a local state
				if (before.type == 'action' && before.resultName && before.actionTarget && before.action) {
					result[before.resultName] = this.$services.page.getActionOutput(pageInstance, before.actionTarget, before.action);
				}
				else if (before.type == "operation" && before.operation && before.resultName) {
					result[before.resultName] = this.$services.page.getSwaggerOperationOutputDefinition(before.operation);
				}
			}
			return result;
		},
		// get all the events that can occur from these triggers
		getEvents: function(page, target) {
			var result = {};
			var self = this;
			var pageInstance = this.$services.page.getPageInstance(page);
			if (target.triggers) {
				target.triggers.forEach(function(trigger) {
					var internalState = self.getInternalState(page, trigger);
					trigger.actions.forEach(function(action) {
						if (nabu.page.event.getName(action, "event") && nabu.page.event.getName(action, "event") != "$close") {
							if (action.eventContent) {
								result[nabu.page.event.getName(action, "event")] = internalState[action.eventContent];
							}
							else {
								var type = nabu.page.event.getType(action, "event");
								result[nabu.page.event.getName(action, "event")] = type;
							}
						}
					});
					// no content currently
					if (trigger.errorEvent) {
						result[trigger.errorEvent] = {};
					}
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
			var triggers = target.triggers ? target.triggers.filter(function(x) {
				return x.trigger == trigger
					&& (!x.condition || self.$services.page.isCondition(x.condition, value, instance));
			}) : [];
			
			var promises = triggers.map(function(x) {
				var actions = x.actions.filter(function(y) {
					return !y.condition || self.$services.page.isCondition(y.condition, value, instance);
				});
				
				// local state we have built up, we can get variables from there
				var state = {};
				
				// we start a new promise for the full trigger
				var triggerPromise = self.$services.q.defer();
				
				// actions can be immediately run or chained
				var runAction = function(index, lastPromise) {
					var action = actions[index];
					
					var getBindings = function() {
						var parameters = {};
						var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
						Object.keys(action.bindings).map(function(key) {
							if (action.bindings[key] != null) {
								console.log("resolving", action.bindings[key], state);
								var value = null;
								
								// need to check if you want to access local state
								var index = action.bindings[key].indexOf(".");
								var resolved = false;
								if (index > 0) {
									var variableName = action.bindings[key].substring(0, index);
									// if we have it in state, that wins
									if (state.hasOwnProperty(variableName)) {
										value = self.$services.page.getValue(state, action.bindings[key]);
										resolved = true;
									}
								}
								if (!resolved) {
									value = self.$services.page.getBindingValue(pageInstance, action.bindings[key], instance);
								}
								if (value != null) {
									parameters[key] = value;
								}
							}
						});
						return parameters;
					}
					
					var handler = function() {
						// event-based
						if (action.type == "event" && nabu.page.event.getName(action, "event")) {
							var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
							return pageInstance.emit(
								nabu.page.event.getName(action, "event"),
								action.eventContent ? state[action.eventContent] : nabu.page.event.getInstance(action, "event", instance.page, instance)
							);
						}
						// route based
						else if (action.type == "route" && (action.route || action.routeFormula)) {
							var route = action.routeAsFormula ? self.$services.page.eval(action.routeFormula, self.state, instance) : action.route;
							// if we are using an anchor we are either rendering outside ($blank, $window etc) or in a very specific location which can likely not be reached on replay
							// so we don't store it
							if (!action.anchor) {
								self.$services.page.chosenRoute = route;
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
						else if (action.type == "route" && action.url) {
							var url = self.$services.page.interpret(action.url, instance);
							if (action.anchor == "$blank") {
								window.open(url);
							}
							else {
								window.location = url;
							}
						}
						// we might want to run an action
						else if (action.type == "action" && action.action) {
							if (action.actionTarget) {
								var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
								var target = self.$services.page.getActionTarget(pageInstance, action.actionTarget);
								// at this point it is a renderer or a component
								if (target && target.runAction) {
									var runBefore = null;
									var runAfter = null;
									var runError = null;
									// if the target has triggers of its own, we need to check
									// a renderer uses a "target" which is either a cell or a row
									// a regular component uses a cell (normally never a row?)
									var targetConfiguration = target.target ? target.target : (target.cell ? target.cell : target.row);
									if (targetConfiguration.triggers) {
										runBefore = targetConfiguration.triggers.filter(function(x) {
											return x.trigger == action.action + ":before";
										});
										runAfter = targetConfiguration.triggers.filter(function(x) {
											return x.trigger == action.action + ":after";
										});
										runError = targetConfiguration.triggers.filter(function(x) {
											return x.trigger == action.action + ":error";
										});
									}
									var beforePromise = null;
									if (runBefore && runBefore.length) {
										beforePromise = self.$services.triggerable.trigger(targetConfiguration, action.action + ":before", null, target);
									}
									
									var runTargetAction = function() {
										var result = target.runAction(action.action, getBindings());
										var promise = self.$services.q.defer();
										if (result && result.then) {
											result.then(function(answer) {
												if (action.resultName) {
													state[action.resultName] = answer;
												}
												if (runAfter && runAfter.length) {
													self.$services.triggerable.trigger(targetConfiguration, action.action + ":after", null, target).then(function() {
														promise.resolve(answer)
													}, promise);
												}
												else {
													promise.resolve(answer);
												}
											}, function(error) {
												if (runError && runError.length) {
													self.$services.triggerable.trigger(targetConfiguration, action.action + ":error", null, target).then(function() {
														promise.reject(error)
													}, promise);	
												}
												else {
													promise.reject(error);
												}
											});
										}
										else {
											promise.resolve();
										}
										return promise;
									}
									if (beforePromise) {
										var overallPromise = self.$services.q.defer();
										beforePromise.then(function() {
											runTargetAction().then(overallPromise, overallPromise);
										}, overallPromise);
										return overallPromise;
									}
									else {
										return runTargetAction();
									}
								}
							}
						}
						else if (action.type == "operation" && action.operation) {
							var operation = self.$services.swagger.operations[action.operation];
							var parameters = getBindings();
							return self.$services.swagger.execute(action.operation, parameters).then(function(answer) {
								if (action.resultName) {
									state[action.resultName] = answer;
								}
							});
						}
						else if (action.type == "javascript" && action.javascript) {
							var script = action.javascript;
							// if we don't wrap it in a function, it might only execute the first line
							// when dealing with formatting or conditions that might be wanted
							// however, in this location we want to execute a full script, we are not assigning or conditioning
							if (script.trim().indexOf("function") != 0) {
								script = "function(){ " + script + "}";
							}
							var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
							var result = self.$services.page.eval(script, pageInstance.variables, instance);
							if (result && result.then) {
								return result;
							}
							else {
								return self.$services.q.resolve(result);
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
							else if (promise) {
								promise.then(function() {
									runAction(index + 1, promise);
								}, triggerPromise);
							}
							else {
								runAction(index + 1, promise);
							}
						};
						
						var result = handler();
						
						// we don't want to chain it, immediately execute
						if (!lastPromise || action.immediate) {
							// if we returned a promise, we want to keep in mind when running following actions
							if (result && result.then) {
								// if we have a lastpromise and we are in immediate mode, we are actually in parallel
								if (lastPromise && action.immediate) {
									lastPromise = self.$services.q.all([lastPromise, result]);
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
							runNext(result && result.then ? result : lastPromise);
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
				
				return triggerPromise.then(function() {
					if (x.closeEvent) {
						instance.$emit("close");
					}
				}, function(error) {
					if (x.errorEvent) {
						var pageInstance = self.$services.page.getPageInstance(self.page);
						pageInstance.emit(x.errorEvent, error ? error : {});
					}
				});
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
		},
		allowClosing: {
			type: Boolean,
			default: false
		}
	},
	created: function() {
		// normalize
		if (!this.target[this.name]) {
			Vue.set(this.target, this.name, []);
		}
	},
	computed: {
		actionTypes: function() {
			var types = [];
			types.push({
				title: "Call a REST operation in the backend",
				name: "operation"
			});
			types.push({
				title: "Download data from the backend",
				name: "download"
			})
			types.push({
				title: "Call an action on another component",
				name: "action"
			});
			types.push({
				title: "Send an event to the entire page",
				name: "event"
			});
			types.push({
				title: "Show a notification to the user",
				name: "notification"
			})
			types.push({
				title: "Redirect the user to another page (this is a final action)",
				name: "route"
			});
			types.push({
				title: "Scroll to a particular position in the page",
				name: "scroll"
			});
			types.push({
				title: "Execute javascript",
				name: "javascript"
			});
			types.push({
				title: "Send notification to user",
				name: "notification"
			});
			types.push({
				title: "Reset other events",
				name: "reset"
			});
			return types;
		}
	},
	methods: {
		getAnchors: function(value) {
			var result = ["$blank", "$window"];
			document.body.querySelectorAll("[anchor]").forEach(function(element) {
				result.push(element.getAttribute("anchor"));
			})
			result.sort();
			if (value) {
				result = result.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			return result;
		},
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
		getAvailableParameters: function(trigger, action) {
			var result = {};
			nabu.utils.objects.merge(result, this.$services.page.getAllAvailableParameters(this.page));
			nabu.utils.objects.merge(result, this.$services.triggerable.getInternalState(this.page, trigger, action));
			return result;
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
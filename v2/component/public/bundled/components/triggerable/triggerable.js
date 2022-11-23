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
		getInternalState: function(page, trigger, action, triggers) {
			var result = {};
			if (trigger.trigger && triggers && triggers[trigger.trigger]) {
				result[trigger.trigger] = triggers[trigger.trigger]; 
			}
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
		// get all the error "types" that can be caused by a certain trigger
		getTriggerErrorTypes: function(page, target) {
			var result = [];
			if (target && target.triggers) {
				var pageInstance = this.$services.page.getPageInstance(page);
				var available = this.$services.page.getAvailableActions(pageInstance);
				target.triggers.forEach(function(trigger) {
					if (trigger.actions) {
						trigger.actions.forEach(function(action) {
							// if we actually call an action on another component, check the action definition to see if it can return custom error types
							if (action.type == "action") {
								var chosenAction = available.filter(function(x) {
									return x.name == action.action;
								})[0];
								if (chosenAction && chosenAction.errors && chosenAction.errors.length) {
									nabu.utils.arrays.merge(result, chosenAction.errors);
								}
								else if (result.indexOf(action.action) < 0) {
									result.push(action.action);
								}
							}
							else if (result.indexOf(action.type) < 0) {
								result.push(action.type);
							}
						})
					}
				});
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
								var type = nabu.page.event.getType(action, "event", page);
								result[nabu.page.event.getName(action, "event")] = type;
							}
						}
					});
					// no content currently
					if (trigger.errorEvent) {
						result[trigger.errorEvent] = self.$services.swagger.resolve("#/definitions/StructuredErrorResponse");
					}
				});
			}
			return result;
		},
		// check if we can trigger on this one
		canTrigger: function(target, trigger) {
			return target.triggers ? target.triggers.filter(function(x) {
				return x.trigger == trigger;
			}).length > 0 : false;
		},
		// you can untrigger, for example hover effect might stop once you have a mouseout
		// or the select event might stop once you reload the data and nothing is selected anymore
		// or the button click might stop once the button is removed completely
		// if no specific trigger is passed in (e.g. select), we untrigger everything, this can be handy for example on destroy
		untrigger: function(target, trigger, instance) {
			var self = this;
			// TODO: the name "triggers" is actually configurable
			var triggers = target.triggers ? target.triggers.filter(function(x) {
				return !trigger || x.trigger == trigger;
			}) : [];
			triggers.forEach(function(x, triggerIndex) {
				if (instance["$$triggerTimer" + triggerIndex]) {
					if (x.timeout) {
						clearTimeout(instance["$$triggerTimer" + triggerIndex]);
					}
					else if (x.interval) {
						clearInterval(instance["$$triggerTimer" + triggerIndex]);
					}
					instance["$$triggerTimer" + triggerIndex] = null;
				}
				if (instance["$$triggerPromise" + triggerIndex]) {
					instance["$$triggerPromise" + triggerIndex].reject();
					instance["$$triggerPromise" + triggerIndex] = null;
				}
				if (x.actions) {
					x.actions.forEach(function(action) {
						// we can untoggle the visibility
						if (action.type == "visibility" && action.closeableTarget) {
							if (action.allowUntrigger) {
								var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
								// if we were aiming for visibility, the untrigger is closing it again
								if (action.closeableAction == "visible") {
									Vue.set(pageInstance.closed, action.closeableTarget, "$any");
								}
								// and the other way around
								else if (action.closeableAction == "hidden") {
									Vue.set(pageInstance.closed, action.closeableTarget, null);
								}
								// otherwise, we just toggle
								// note that if (in the mean time) someone else played with the visibility, this might not have the desired effect
								else {
									// just toggle it
									Vue.set(pageInstance.closed, action.closeableTarget, pageInstance.closed[action.closeableTarget] == null ? "$any" : null);
								}
							}
						}
						// we can withdraw an event by setting it to null
						else if (action.type == "event" && nabu.page.event.getName(action, "event")) {
							if (action.allowUntrigger) {
								var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
								return pageInstance.emit(
									nabu.page.event.getName(action, "event"),
									null
								);
							}
						}
					});
				}	
			});
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
					&& (!x.condition || self.$services.page.isCondition(x.condition, value, instance))
					&& (!x.triggerError || (value && value.errorType == x.triggerError));
			}) : [];
			
			var promises = triggers.map(function(x, triggerIndex) {
				var state = {};
				
				// the initial state
				state[trigger] = value;
				
				// TODO: don't pre-filter actions, but instead filter them as we go further into the pipeline
				// if we then pass in the "state" (rather than the value), we can evaluate to the local pipeline state
				
				var customValueFunction = function(path, literal) {
					// look up in local state so you can evaluate that
					var result = self.$services.page.getValue(state, path);
					// fallback to global value function!
					if (result == null) {
						result = instance.$value(path, literal);
					}
					return result;
				}
				
				var actions = x.actions.filter(function(y) {
					return !y.condition || self.$services.page.isCondition(y.condition, value, instance, customValueFunction);
				});
				
				// local state we have built up, we can get variables from there
				
				// when the trigger execution stops specifically because of a confirmation failure (rather than an actual error), we don't want to run the error routines but DO want to fail the trigger
				var confirmationError = false;
				
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
									// does not take into account "." separated field names which are received
									//parameters[key] = value;
									self.$services.page.setValue(parameters, key, value);
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
							var url = self.$services.page.interpret(action.url, instance, null, customValueFunction);
							if (action.anchor == "$blank") {
								window.open(url);
							}
							else {
								window.location = url;
							}
						}
						else if (action.type == "notification") {
							var notification = {};
							notification.duration = action.notificationDuration ? parseInt(action.notificationDuration) : null;
							notification.title = action.notificationTitle ? self.$services.page.translate(self.$services.page.interpret(action.notificationTitle, instance)) : null;
							notification.message = action.notificationMessage ? self.$services.page.translate(self.$services.page.interpret(action.notificationMessage, instance)) : null;
							notification.severity = action.notificationColor;
							notification.closeable = !!action.notificationCloseable;
							notification.icon = action.notificationIcon;
							self.$services.notifier.push(notification);
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
													self.$services.triggerable.trigger(targetConfiguration, action.action + ":after", answer, target).then(function() {
														promise.resolve(answer)
													}, promise);
												}
												else {
													promise.resolve(answer);
												}
											}, function(error) {
												if (runError && runError.length) {
													self.$services.triggerable.trigger(targetConfiguration, action.action + ":error", error, target).then(function() {
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
							try {
								var promise = self.$services.q.defer();
								self.$services.swagger.execute(action.operation, parameters).then(function(answer) {
									if (action.resultName) {
										state[action.resultName] = answer;
									}
									promise.resolve(answer);
								}, function(error) {
									// TODO: get the response code
									promise.reject({errorType: "operation", error: error});
								});
								return promise;
							}
							catch (exception) {
								console.error("Could not run operation: " + action.operation, exception);
								return self.$services.q.reject({action: "operation", exception: exception});
							}
						}
						else if (action.type == "download" && action.operation) {
							var parameters = getBindings();
							var startDownload = function(url) {
								var operation = self.$services.swagger.operations[action.operation];
								if (operation.method == "get" && operation.produces && operation.produces.length && operation.produces[0] == "application/octet-stream") {
									if (action.anchor != "$window") {
										self.$services.page.download(url, function() {
											// download failed, but there is no equivalent for when it is successful, hard to put it in a promise
										});
									}
									else {
										window.location = self.$services.swagger.parameters(action.operation, parameters).url;
									}
								}
								else if (operation["x-downloadable"] == "true") {
									var contentType = null;
									if (action.downloadAs == "excel") {
										contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
									}
									else if (action.downloadAs == "csv") {
										contentType = "text/csv";
									}
									else if (action.downloadAs == "json") {
										contentType = "application/json";
									}
									else if (action.downloadAs == "xml") {
										contentType = "application/xml";
									}
									var separator = url.indexOf("?") < 0 ? "?" : "&";
									if (contentType != null) {
										url += separator + "header:Accept=" + contentType;
										separator = "&";
									}
									url += separator + "header:Accept-Content-Disposition=attachment";
									if (action.fileName) {
										url += ";fileName=" + self.$services.page.interpret(action.fileName, instance);
									}
									if (action.anchor != "$window") {
										self.$services.page.download(url, function() {
											// nothing yet
										});
									}
									else {
										window.location = url;
									}
								}
							}
							// in the new setup, we use otp generation to create a link that is self-authorizing
							if (self.$services.user.downloadUrl) {
								return self.$services.user.downloadUrl(action.operation, parameters).then(function(url) {
									if (url) {
										startDownload(url);
									}
								});
							}
							else {
								startDownload(self.$services.swagger.parameters(action.operation, parameters).url);
								return self.$services.q.resolve();
							}
						}
						else if (action.type == "javascript" && action.javascript) {
							var script = action.javascript;
							// if we don't wrap it in a function, it might only execute the first line
							// when dealing with formatting or conditions that might be wanted
							// however, in this location we want to execute a full script, we are not assigning or conditioning
							if (script.trim().indexOf("function") != 0) {
								script = "function(){ " + script + "}";
							}
							//var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
							//var result = self.$services.page.eval(script, pageInstance.variables, instance);
							var result = self.$services.page.eval(script, state, instance, customValueFunction);
							if (result && result.then) {
								return result;
							}
							else {
								return self.$services.q.resolve(result);
							}
						}
						else if (action.type == "function" && action.function) {
							var func = self.$services.page.getRunnableFunction(action.function);
							if (!func) {
								throw "Could not find function: " + action.function; 
							}
							var promise = self.$services.q.defer();
							try {
								var result = self.$services.page.runFunction(func, getBindings(), self, promise);
							}
							catch (exception) {
								console.error("Could not run function: " + action.function, exception);
								promise.reject(exception);
							}
							return promise;
						}
						else if (action.type == "confirmation" && action.confirmation) {
							var promise = self.$services.q.defer();
							self.$confirm({message:self.$services.page.translate(self.$services.page.interpret(action.confirmation, instance))}).then(promise, function(error) {
								confirmationError = true;
								promise.reject(error);
							});
							return promise;
						}
						else if (action.type == "visibility" && action.closeableTarget) {
							var pageInstance = self.$services.page.getPageInstance(instance.page, instance);
							// if we want to ensure visibility, we must wipe the "closed" state
							if (action.closeableAction == "visible") {
								Vue.set(pageInstance.closed, action.closeableTarget, null);
							}
							else if (action.closeableAction == "hidden") {
								Vue.set(pageInstance.closed, action.closeableTarget, "$any");
							}
							else {
								// just toggle it
								Vue.set(pageInstance.closed, action.closeableTarget, pageInstance.closed[action.closeableTarget] == null ? "$any" : null);
							}
							return self.$services.q.resolve();
						}
						else if (action.type == "scroll" && action.scrollTo) {
							var element = document.querySelector(action.scrollTo);
							if (element) {
								// TODO: make the block target configurable, center is "generally" acceptable
								element.scrollIntoView({behavior: "smooth", block: "center"});
								return self.$services.q.resolve(element);
							}
							else {
								return self.$services.q.reject();
							}
						}
					};
					
					if (!self.edit) {
						var runNext = function(promise) {
							// we finished!
							if (index == actions.length - 1) {
								// we want to keep repeating
								if (x.interval) {
									instance["$$triggerTimer" + triggerIndex] = setTimeout(function() {
										runAction(0);
									}, x.interval);
								}
								// if we passed in a promise, wait for it to finish
								else if (promise) {
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

					// for both the timeout and interval, we want to capture the promise so we can reject it later					
					// there is already a global "untrigger" when something unloads, so it should be cleanly stopped
					if (x.timeout || x.interval) {
						instance["$$triggerPromise" + triggerIndex] = triggerPromise;
					}
					
					// if we want confirmation and you reject, we don't start
					// deprecated, confirmation is now part of the actions
					if (x.confirmation) {
						self.$confirm({message:self.$services.page.translate(self.$services.page.interpret(x.confirmation, instance))}).then(function() {
							runAction(0);
						}, triggerPromise);
					}
					// if we have a timeout, use it to delay the start
					// if we only have an interval, the first run is immediately
					// if we have a timeout and interval, we only start after that timeout
					else if (x.timeout) {
						instance["$$triggerTimer" + triggerIndex] = setTimeout(function() {
							runAction(0);
						}, x.timeout);
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
					// deprecated and never used, can be removed
					if (x.errorEvent) {
						var pageInstance = self.$services.page.getPageInstance(self.page);
						pageInstance.emit(x.errorEvent, error ? error : {});
					}
					if (!confirmationError) {
						var errorName = x.trigger + ":error";
						if (x.errorTrigger) {
							errorName = x.errorTrigger;
						}
						self.trigger(target, errorName, error, instance);
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
				title: "Redirect the user to another page",
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
				title: "Reset other events",
				name: "reset"
			});
			types.push({
				title: "Call a function",
				name: "function"
			});
			types.push({
				title: "Ask for confirmation",
				name: "confirmation"
			});
			types.push({
				title: "Change visibility of cell or row",
				name: "visibility"
			});
			return types;
		}
	},
	methods: {
		getTriggerErrorTypes: function(value) {
			var result = this.$services.triggerable.getTriggerErrorTypes(this.page, this.target);
			if (result.length && value) {
				result = result.filter(function(x) {
					return x.toLowerCase().indexOf(value.toLowerCase()) >= 0;
				});
			}
			return result;
		},
		finalizedTrigger: function(trigger) {
			return trigger.actions && trigger.actions.filter(function(x) {
				return x.type == "route";
			}).length > 0;
		},
		getAvailableColors: function(value) {
			var variants = [];
			this.$services.page.getArisComponentHierarchy("alert").forEach(function(component) {
				if (component.dimensions) {
					component.dimensions.forEach(function(x) {
						if (x.name == "color") {
							x.options.forEach(function(opt) {
								if (variants.indexOf(opt) < 0) {
									variants.push(opt);
								}
							})
						}
					})
				}
				/*
				if (component.variants != null) {
					component.variants.forEach(function(variant) {
						if (variants.indexOf(variant.name) < 0) {
							variants.push(variant.name);
						}
					});
				}
				*/
			});
			if (value != null) {
				variants = variants.filter(function(x) { return x.toLowerCase().indexOf(value.toLowerCase()) >= 0 });
			}
			variants.sort();
			return variants;
		},
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
			nabu.utils.objects.merge(result, this.$services.triggerable.getInternalState(this.page, trigger, action, this.triggers));
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
			if (this.target.triggers) {
				this.target.triggers.forEach(function(trigger) {
					var name = null;
					if (trigger.errorTrigger) {
						name = trigger.errorTrigger;
					}
					else if (trigger.trigger) {
						name = trigger.trigger + ":error";
					}
					if (name != null && result.indexOf(name) < 0) {
						result.push(name);
					}
				});
			}
			result.sort();
			return result;
		}	
	}
})
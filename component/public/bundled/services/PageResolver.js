nabu.services.VueService(Vue.extend({
	data: function() {
		return {
			resolved: {},
			resolvers: {}
		}
	},
	created: function() {
		var self = this;
		this.resolver = nabu.utils.misc.BatchResolver(
			// resolver
			function(ids) { return self.$services.swagger.execute("nabu.cms.core.manage.node.rest.node.resolve", {ids:ids}) },
			// cacher
			function(key, value) { if (value) self.merge(key, value); return self.resolved[key] },
			// generator
			function(key) { Vue.set(self.resolved, key, {}); return self.resolved[key]; },
			// mapper
			function(result) { return result.id }
		);
	},
	methods: {
		// the ids is the input field we can use to input the ids to be searched
		// the id is the field in the returned values that can be used to extract the id again
		getResolver: function(operation, ids, id) {
			if (!this.resolvers[operation + "." + ids]) {
				var self = this;
				Vue.set(this.resolved, operation + "." + ids, {});
				var resolved = this.resolved[operation + "." + ids];
				this.resolvers[operation + "." + ids] = nabu.utils.misc.BatchResolver(
					// resolver
					function(idList) {
						var properties = {};
						properties[ids] = idList;
						return self.$services.swagger.execute(operation, properties);
					},
					// cacher
					function(key, value) { if (value) self.merge(resolved, key, value); return resolved[key] },
					// generator
					function(key) { Vue.set(resolved, key, {}); return resolved[key]; },
					// mapper
					function(result) { return result[id] }
				);
			}
			return this.resolvers[operation + "." + ids];
		},
		resolve: function(operation, ids, id, value) {
			// without this, it goes into an infinite resolving loop
			// only if we use the merge() function, if we simply set the full value it doesn't
			if (this.resolved[operation + "." + ids] && this.resolved[operation + "." + ids][value]) {
				return this.resolved[operation + "." + ids][value];
			}
			return this.getResolver(operation, ids, id)(value);
		},
		merge: function(resolved, key, value) {
			var self = this;
			if (!resolved[key]) {
				Vue.set(resolved, key, {});
			}
			Object.keys(value).map(function(childKey) {
				Vue.set(resolved[key], childKey, value[childKey]);	
			});
		}
	}
}), { name: "nabu.page.services.PageResolver" });
Vue.component("data-field-picker", {
	template: "#data-field-picker",
	props: {
		value: {
			type: Array,
			required: true
		},
		fields: {
			type: Array,
			required: true
		}
	},
	data: function() {
		return {
			result: []
		}	
	},
	created: function() {
		nabu.utils.arrays.merge(this.result, this.fields.map(function(x) {
			return {
				name: x,
				checked: true
			}
		}));
		console.log("fields are", this.result);
	},
	methods: {
		upAll: function(field) {
			var index = this.result.indexOf(field);
			if (index > 0) {
				this.result.splice(index, 1);
				this.result.unshift(field);	
			}
		},
		up: function(field) {
			var index = this.result.indexOf(field);
			if (index > 0) {
				this.result.splice(index, 1);
				this.result.splice(index - 1, 0, field);
			}
		},
		down: function(field) {
			var index = this.result.indexOf(field);
			if (index < this.result.length - 1) {
				this.result.splice(index, 1);
				this.result.splice(index + 1, 0, field);
			}
		},
		downAll: function(field) {
			var index = this.result.indexOf(field);
			if (index < this.result.length - 1) {
				this.result.splice(index, 1);
				this.result.splice(this.result.length - 1, 0, field);
			}
		}
	},
	watch: {
		result: {
			deep: true,
			handler: function() {
				this.value.splice(0);
				nabu.utils.arrays.merge(this.value, this.result.filter(function(x) {
					return x.checked
				}).map(function (x){
					return x.name
				}));
			}
		}
	}
})
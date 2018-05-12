nabu.services.VueService(Vue.extend({
	methods: {
		format: function(value, properties) {
			if (!properties.format) {
				return value;
			}
			else if (properties.format == "date") {
				return this.date(value, properties.dateFormat);
			}
			// backwards compatibility
			else if (properties.format == "dateTime") {
				return this.date(value, "dateTime");
			}
			else if (properties.format == "number") {
				return this.number(value, properties.amountOfDecimals);
			}
			else if (properties.format == "masterdata") {
				return this.masterdata(value);
			}
			else if (properties.format == "javascript") {
				return this.javascript(value, properties.javascript);
			}
			else {
				console.error("Incorrect properties for formatting", value, properties);
			}
		},
		javascript: function(value, code) {
			if (code instanceof Function) {
				return code(value);
			}
			else {
				var result = eval(code);
				if (result instanceof Function) {
					result = result(value);
				}
				return result;
			}
		},
		date: function(date, format) {
			if (!date) {
				return null;
			}
			else if (typeof(date) == "string") {
				date = new Date(date);
			}
			if (!format || format == "date") {
				format = "yyyy-MM-dd";
			}
			else if (format == "dateTime") {
				format = "yyyy-MM-ddTHH:mm:ss.SSS";
			}
			format = format.replace(/MMMM/g, nabu.utils.dates.months()[date.getMonth()]);
			format = format.replace(/MMM/g, nabu.utils.dates.months()[date.getMonth()].substring(0, 3));
			format = format.replace(/MM/g, (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1));
			format = format.replace(/M/g, date.getMonth() + 1);
			format = format.replace(/yyyy/g, date.getFullYear());
			format = format.replace(/yy/g, ("" + date.getFullYear()).substring(2, 4));
			format = format.replace(/dd/g, (date.getDate() < 10 ? "0" : "") + date.getDate());
			format = format.replace(/d/g, date.getDate());
			format = format.replace(/HH/g, (date.getHours() < 10 ? "0" : "") + date.getHours());
			format = format.replace(/H/g, date.getHours());
			format = format.replace(/mm/g, (date.getMinutes() < 10 ? "0" : "") + date.getMinutes());
			format = format.replace(/m/g, date.getMinutes());
			format = format.replace(/ss/g, (date.getSeconds() < 10 ? "0" : "") + date.getSeconds());
			format = format.replace(/s/g, date.getSeconds());
			format = format.replace(/[S]+/g, date.getMilliseconds());
			// we get an offset in minutes
			format = format.replace(/[X]+/g, Math.floor(date.getTimezoneOffset() / 60) + ":" + date.getTimezoneOffset() % 60);
			return format;
		},
		masterdata: function(id) {
			if (!id) {
				return "";
			}
			var entry = this.$services.masterdata.entry(id);
			if (entry) {
				return entry.label;
			}
			var category = this.$services.masterdata.category(id);
			if (category) {
				return category.label;
			}
			return this.$services.masterdata.resolve(id);
		},
		number: function(input, amountOfDecimals) {
			amountOfDecimals = typeof(amountOfDecimals) === "number" ? amountOfDecimals : 2;
            return typeof(input) === "number" ? input.toFixed(amountOfDecimals) : input;
		}
	}
}), { name: "nabu.page.services.Formatter" });
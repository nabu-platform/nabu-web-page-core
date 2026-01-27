/**
 * Test file for Formatter.duration method
 * Tests the actual Vue service implementation
 */

const fs = require('fs');
const path = require('path');

// Mock Vue
const Vue = {
	extend: function(component) {
		return component;
	}
};

// Store the component definition when VueService is called
let formatterComponent = null;

// Mock nabu.services.VueService
const nabu = {
	services: {
		VueService: function(component, options) {
			// Store the component so we can use it in tests
			formatterComponent = component;
			// Return the component definition for registration
			return component;
		}
	}
};

// Mock global Vue and nabu
global.Vue = Vue;
global.nabu = nabu;

// Load the actual Formatter.js file
const formatterPath = path.join(__dirname, '../Formatter.js');
const formatterCode = fs.readFileSync(formatterPath, 'utf8');

// Evaluate the Formatter.js file to register the service
// This will call nabu.services.VueService with the component definition
eval(formatterCode);

describe('Formatter.duration', () => {
	let formatterInstance;

	beforeEach(() => {
		// Create a new instance of the formatter service
		formatterInstance = {
			$services: {
				page: {
					getLocale: jest.fn(() => 'en')
				}
			}
		};
		
		// Bind the methods from the component to our instance
		if (formatterComponent && formatterComponent.methods) {
			Object.keys(formatterComponent.methods).forEach(methodName => {
				formatterInstance[methodName] = formatterComponent.methods[methodName].bind(formatterInstance);
			});
		}
	});

	// Helper function to get duration result
	function getDuration(ms, locale) {
		return formatterInstance.duration(ms, locale);
	}

	describe('basic functionality', () => {
		test('should format all unit types with correct values', () => {
			expect(getDuration(500)).toMatch(/500\s+milliseconds/);
			expect(getDuration(1000)).toMatch(/1\s+second/);
			expect(getDuration(60000)).toMatch(/1\s+minute/);
			expect(getDuration(3600000)).toMatch(/1\s+hour/);
			expect(getDuration(86400000)).toMatch(/1\s+day/);
		});

		test('should format combined units with correct values', () => {
			// 183245500 ms = 2 days, 2 hours, 54 minutes, 5 seconds, 500 milliseconds
			const result = getDuration(183245500);
			expect(result).toMatch(/2\s+days/);
			expect(result).toMatch(/2\s+hours/);
			expect(result).toMatch(/54\s+minutes/);
			expect(result).toMatch(/5\s+seconds/);
			expect(result).toMatch(/500\s+milliseconds/);
		});
	});

	describe('edge cases', () => {
		test('should handle zero milliseconds', () => {
			expect(getDuration(0)).toBe('');
		});

		test('should handle very small and large values', () => {
			expect(getDuration(1)).toMatch(/1\s+millisecond/);
			expect(getDuration(172800000)).toMatch(/2\s+days/);
		});

		test('should not include zero units', () => {
			const result = getDuration(60000); // 1 minute, 0 seconds
			expect(result).toMatch(/1\s+minute/);
			expect(result).not.toMatch(/0\s+second/);
			expect(result).not.toMatch(/second/);
		});
	});

	describe('locale support', () => {
		test('should format English locale correctly', () => {
			const result = getDuration(7323000, 'en'); // 2 hours, 2 minutes, 3 seconds
			expect(result).toMatch(/2\s+hours/);
			expect(result).toMatch(/2\s+minutes/);
			expect(result).toMatch(/3\s+seconds/);
		});

		test('should format French locale correctly', () => {
			const result = getDuration(90061000, 'fr'); // 1 day, 1 hour, 1 minute, 1 second
			expect(result).toMatch(/1\s+jour/);
			expect(result).toMatch(/1\s+heure/);
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/1\s+seconde/);
		});

		test('should format German locale correctly', () => {
			const result = getDuration(7323000, 'de'); // 2 hours, 2 minutes, 3 seconds
			expect(result).toMatch(/2\s+Stunden/);
			expect(result).toMatch(/2\s+Minuten/);
			expect(result).toMatch(/3\s+Sekunden/);
		});
	});

	describe('Vue service integration', () => {
		test('should be callable as a method on the formatter instance', () => {
			expect(typeof formatterInstance.duration).toBe('function');
			const result = formatterInstance.duration(1000);
			expect(result).toMatch(/1\s+second/);
		});
	});
});

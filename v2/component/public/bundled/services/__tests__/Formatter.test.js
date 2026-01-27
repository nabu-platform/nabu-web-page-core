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
		// The component has methods that we can call
		formatterInstance = {
			$services: {
				page: {
					getLocale: jest.fn(() => 'en')
				}
			}
		};
		
		// Bind the methods from the component to our instance
		// This simulates how Vue would bind methods to the component instance
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
		test('should format 1 second correctly', () => {
			const result = getDuration(1000);
			expect(result).toContain('1');
			expect(result).toContain('second');
			// Verify it's exactly 1 second
			expect(result).toMatch(/1\s+second/);
		});

		test('should format 5 seconds correctly', () => {
			const result = getDuration(5000);
			expect(result).toContain('5');
			expect(result).toContain('second');
			expect(result).toMatch(/5\s+seconds/);
		});

		test('should format 1 minute correctly', () => {
			const result = getDuration(60000);
			expect(result).toContain('1');
			expect(result).toContain('minute');
			expect(result).toMatch(/1\s+minute/);
		});

		test('should format 1 hour correctly', () => {
			const result = getDuration(3600000);
			expect(result).toContain('1');
			expect(result).toContain('hour');
			expect(result).toMatch(/1\s+hour/);
		});

		test('should format 1 day correctly', () => {
			const result = getDuration(86400000);
			expect(result).toContain('1');
			expect(result).toContain('day');
			expect(result).toMatch(/1\s+day/);
		});

		test('should format 500 milliseconds correctly', () => {
			const result = getDuration(500);
			expect(result).toContain('500');
			expect(result).toContain('millisecond');
			expect(result).toMatch(/500\s+milliseconds/);
		});
	});

	describe('combined units', () => {
		test('should format multiple units correctly', () => {
			const result = getDuration(90061000); // 1 day, 1 hour, 1 minute, 1 second
			expect(result).toContain('day');
			expect(result).toContain('hour');
			expect(result).toContain('minute');
			expect(result).toContain('second');
			// Verify values
			expect(result).toMatch(/1\s+day/);
			expect(result).toMatch(/1\s+hour/);
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/1\s+second/);
		});

		test('should format hours and minutes correctly', () => {
			const result = getDuration(3661000); // 1 hour, 1 minute, 1 second
			expect(result).toContain('hour');
			expect(result).toContain('minute');
			expect(result).toContain('second');
			// Verify values
			expect(result).toMatch(/1\s+hour/);
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/1\s+second/);
		});

		test('should format minutes and seconds correctly', () => {
			const result = getDuration(61000); // 1 minute, 1 second
			expect(result).toContain('minute');
			expect(result).toContain('second');
			// Verify values
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/1\s+second/);
		});

		test('should format seconds and milliseconds correctly', () => {
			const result = getDuration(1500); // 1 second, 500 milliseconds
			expect(result).toContain('second');
			expect(result).toContain('millisecond');
			// Verify values
			expect(result).toMatch(/1\s+second/);
			expect(result).toMatch(/500\s+milliseconds/);
		});

		test('should format 2 hours, 30 minutes, 45 seconds correctly', () => {
			const result = getDuration(9045000); // 2 hours, 30 minutes, 45 seconds
			expect(result).toMatch(/2\s+hours/);
			expect(result).toMatch(/30\s+minutes/);
			expect(result).toMatch(/45\s+seconds/);
		});
	});

	describe('edge cases', () => {
		test('should handle zero milliseconds', () => {
			const result = getDuration(0);
			expect(result).toBe('');
		});

		test('should handle very small values', () => {
			const result = getDuration(1);
			expect(result).toContain('millisecond');
			expect(result).toMatch(/1\s+millisecond/);
		});

		test('should handle large values', () => {
			const result = getDuration(172800000); // 2 days
			expect(result).toContain('day');
			expect(result).toMatch(/2\s+days/);
		});

		test('should handle values with remainder', () => {
			const result = getDuration(90000); // 1 minute, 30 seconds
			expect(result).toContain('minute');
			expect(result).toContain('second');
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/30\s+seconds/);
		});
	});

	describe('locale support', () => {
		test('should use default locale (en) when not specified', () => {
			const result = getDuration(1000);
			expect(result).toContain('second');
			expect(result).toMatch(/1\s+second/);
		});

		test('should format English locale correctly', () => {
			const result = getDuration(3661000, 'en'); // 1 hour, 1 minute, 1 second
			expect(result).toMatch(/1\s+hour/);
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/1\s+second/);
		});

		test('should format French locale correctly', () => {
			const result = getDuration(3661000, 'fr'); // 1 hour, 1 minute, 1 second
			// French: "heure", "minute", "seconde"
			expect(result).toMatch(/1\s+heure/);
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/1\s+seconde/);
		});

		test('should format German locale correctly', () => {
			const result = getDuration(3661000, 'de'); // 1 hour, 1 minute, 1 second
			// German: "Stunde", "Minute", "Sekunde"
			expect(result).toMatch(/1\s+Stunde/);
			expect(result).toMatch(/1\s+Minute/);
			expect(result).toMatch(/1\s+Sekunde/);
		});

		test('should format Spanish locale correctly', () => {
			const result = getDuration(3661000, 'es'); // 1 hour, 1 minute, 1 second
			// Spanish: "hora", "minuto", "segundo"
			expect(result).toMatch(/1\s+hora/);
			expect(result).toMatch(/1\s+minuto/);
			expect(result).toMatch(/1\s+segundo/);
		});

		test('should format French locale for minutes', () => {
			const result = getDuration(60000, 'fr'); // 1 minute
			expect(result).toMatch(/1\s+minute/);
		});

		test('should format French locale for hours', () => {
			const result = getDuration(3600000, 'fr'); // 1 hour
			expect(result).toMatch(/1\s+heure/);
		});

		test('should format French locale for days', () => {
			const result = getDuration(86400000, 'fr'); // 1 day
			expect(result).toMatch(/1\s+jour/);
		});

		test('should format German locale for minutes', () => {
			const result = getDuration(60000, 'de'); // 1 minute
			expect(result).toMatch(/1\s+Minute/);
		});

		test('should format German locale for hours', () => {
			const result = getDuration(3600000, 'de'); // 1 hour
			expect(result).toMatch(/1\s+Stunde/);
		});

		test('should format German locale for days', () => {
			const result = getDuration(86400000, 'de'); // 1 day
			expect(result).toMatch(/1\s+Tag/);
		});

		test('should format multiple units in French locale', () => {
			const result = getDuration(90061000, 'fr'); // 1 day, 1 hour, 1 minute, 1 second
			expect(result).toMatch(/1\s+jour/);
			expect(result).toMatch(/1\s+heure/);
			expect(result).toMatch(/1\s+minute/);
			expect(result).toMatch(/1\s+seconde/);
		});

		test('should format multiple units in German locale', () => {
			const result = getDuration(90061000, 'de'); // 1 day, 1 hour, 1 minute, 1 second
			expect(result).toMatch(/1\s+Tag/);
			expect(result).toMatch(/1\s+Stunde/);
			expect(result).toMatch(/1\s+Minute/);
			expect(result).toMatch(/1\s+Sekunde/);
		});

		test('should format plural forms correctly in English', () => {
			const result = getDuration(7323000, 'en'); // 2 hours, 2 minutes, 3 seconds
			expect(result).toMatch(/2\s+hours/);
			expect(result).toMatch(/2\s+minutes/);
			expect(result).toMatch(/3\s+seconds/);
		});

		test('should format plural forms correctly in French', () => {
			const result = getDuration(7323000, 'fr'); // 2 hours, 2 minutes, 3 seconds
			expect(result).toMatch(/2\s+heures/);
			expect(result).toMatch(/2\s+minutes/);
			expect(result).toMatch(/3\s+secondes/);
		});

		test('should format plural forms correctly in German', () => {
			const result = getDuration(7323000, 'de'); // 2 hours, 2 minutes, 3 seconds
			expect(result).toMatch(/2\s+Stunden/);
			expect(result).toMatch(/2\s+Minuten/);
			expect(result).toMatch(/3\s+Sekunden/);
		});
	});

	describe('specific duration values', () => {
		test('should format 1 second correctly', () => {
			const result = getDuration(1000);
			expect(result).toMatch(/1\s+second/);
		});

		test('should format 1 minute correctly', () => {
			const result = getDuration(60000);
			expect(result).toMatch(/1\s+minute/);
		});

		test('should format 1 hour correctly', () => {
			const result = getDuration(3600000);
			expect(result).toMatch(/1\s+hour/);
		});

		test('should format 1 day correctly', () => {
			const result = getDuration(86400000);
			expect(result).toMatch(/1\s+day/);
		});

		test('should format multiple days correctly', () => {
			const result = getDuration(259200000); // 3 days
			expect(result).toMatch(/3\s+days/);
		});

		test('should format complex duration correctly', () => {
			// 2 days, 3 hours, 4 minutes, 5 seconds, 500 milliseconds
			const result = getDuration(183245500);
			expect(result).toMatch(/2\s+days/);
			expect(result).toMatch(/3\s+hours/);
			expect(result).toMatch(/4\s+minutes/);
			expect(result).toMatch(/5\s+seconds/);
			expect(result).toMatch(/500\s+milliseconds/);
		});

		test('should format 30 seconds correctly', () => {
			const result = getDuration(30000);
			expect(result).toMatch(/30\s+seconds/);
		});

		test('should format 15 minutes correctly', () => {
			const result = getDuration(900000);
			expect(result).toMatch(/15\s+minutes/);
		});

		test('should format 24 hours correctly', () => {
			const result = getDuration(86400000);
			expect(result).toMatch(/1\s+day/); // 24 hours = 1 day
		});
	});

	describe('formatting behavior', () => {
		test('should return space-separated values', () => {
			const result = getDuration(61000); // 1 minute, 1 second
			expect(result).toContain(' ');
			expect(result).toMatch(/1\s+minute\s+1\s+second/);
		});

		test('should not include zero units', () => {
			const result = getDuration(60000); // 1 minute, 0 seconds
			// Should not contain "0 second" or similar
			expect(result).not.toMatch(/0\s+second/);
			expect(result).toMatch(/1\s+minute/);
			const parts = result.split(' ');
			expect(parts.length).toBeGreaterThan(0);
		});

		test('should handle exact unit boundaries', () => {
			// Exactly 1 hour
			const result = getDuration(3600000);
			expect(result).toMatch(/1\s+hour/);
			// Should not contain minutes or seconds if exactly 1 hour
			expect(result).not.toMatch(/minute/);
			expect(result).not.toMatch(/second/);
		});

		test('should format with correct spacing between units', () => {
			const result = getDuration(3661000); // 1 hour, 1 minute, 1 second
			// Should have spaces between each unit
			expect(result.split(' ').length).toBeGreaterThan(4); // At least: "1", "hour", "1", "minute", "1", "second"
		});
	});

	describe('Vue service integration', () => {
		test('should be callable as a method on the formatter instance', () => {
			expect(typeof formatterInstance.duration).toBe('function');
			const result = formatterInstance.duration(1000);
			expect(result).toContain('second');
		});

		test('should work with $services.page.getLocale when called from format method context', () => {
			// Simulate how it would be called in the actual service
			formatterInstance.$services.page.getLocale.mockReturnValue('fr');
			const result = formatterInstance.duration(1000, formatterInstance.$services.page.getLocale());
			expect(formatterInstance.$services.page.getLocale).toHaveBeenCalled();
			expect(result).toBeTruthy();
		});

		test('should use the actual duration method from the Vue service', () => {
			// Verify we're using the real implementation
			expect(formatterComponent).not.toBeNull();
			expect(formatterComponent.methods).toBeDefined();
			expect(formatterComponent.methods.duration).toBeDefined();
			expect(typeof formatterComponent.methods.duration).toBe('function');
		});
	});
});

'use strict';

var assert = require('assert');
var Occasion = require('..');

var tz = 'US/Central';
var range = 7;

describe('Tests', function() {
	describe('exports.toISOString()', function() {
		it('should return empty string when the value is not present', function() {
			assert.equal(Occasion.toISOString(), '');
		});
		it('should return 1968-01-01 when the value is 1/1/1968', function() {
			assert.equal(Occasion.toISOString('1/1/1968'), '1968-01-01');
		});
		it('should return 1968-01-01 when the value is new Date(1/1/1968)', function() {
			assert.equal(Occasion.toISOString(new Date('1/1/1968')), '1968-01-01');
		});
	});

	describe('exports.interval()', function() {
		it('should return 0 DAY interval when the value is not present', function() {
			assert.equal(Occasion.interval().sign, '+');
			assert.equal(Occasion.interval().expr, '0');
			assert.equal(Occasion.interval().unit, 'days');
		});
		it('should return 0 DAY interval when the value is not a string', function() {
			assert.equal(Occasion.interval(1).sign, '+');
			assert.equal(Occasion.interval(1).expr, '0');
			assert.equal(Occasion.interval(1).unit, 'days');
		});
		it('should return interval object when the value is 1 YEAR', function() {
			assert.equal(Occasion.interval('1 YEAR').sign, '+');
			assert.equal(Occasion.interval('1 YEAR').expr, '1');
			assert.equal(Occasion.interval('1 YEAR').unit, 'years');
		});
	});

	describe('exports.auditOpenedClamped()', function() {
		it('should return 2000-01-01 06:00:00 when the value is new `2000-01-02`', function() {
			assert.equal(Occasion.auditOpenedClamped('2000-01-02', range, tz), '2000-01-01 06:00:00');
		});
		it('should return 2000-01-01 06:00:00 when the value is new Date(1999-12-30)', function() {
			assert.equal(Occasion.auditOpenedClamped('1999-12-30', range, tz), '2000-01-01 06:00:00');
		});
	});

	/*
	The following tests use some simple intervals to make the calculations easier to reason about.
	Specifically, we set the open interval and licet interval to one month each. This means the
	audit period and audit open period overlap.
	*/
	describe('Audit Recipe: 1 MONTH, Opened 3/1/2017', function() {

		var tz = 'US/Central';
		var opened = '3/1/2017';
		var interval_open = '1 MONTHS';
		var interval_licet = '1 MONTHS';
		var interval_carry = '1 MONTHS';
		var expired, period_max, period_min, carryover_max, carryover_min;

		it('expect opened converted to `2017-03-01`', function() {
			opened = Occasion.toISOString(opened);
			assert.equal(opened, '2017-03-01');
		});
		it('expect opened of 2017-03-01 06:00:00 UTC', function() {
			opened = Occasion.auditOpened(opened, tz);
			assert.equal(opened, '2017-03-01 06:00:00');
		});

		it('closes of 2017-04-01 04:59:59 UTC', function() {
			expired = Occasion._auditExpired(opened, interval_open, tz);
			assert.equal(expired, '2017-04-01 04:59:59');
		});

		it('period_max of 2017-04-01 04:59:59 UTC', function() {
			period_max = Occasion._auditPeriodMax(expired);
			assert.equal(period_max, '2017-04-01 04:59:59');
		});

		it('period_min of 2017-03-01 06:00:00 UTC', function() {
			period_min = Occasion._auditPeriodMin(period_max, interval_licet, tz);
			assert.equal(period_min, '2017-03-01 06:00:00');
		});

		it('period_min equals opened', function() {
			assert.equal(period_min, opened);
		});

		it('carryover_max of 2017-03-01 05:59:59 UTC (one second before period_max)', function() {
			carryover_max = Occasion._auditCarroverMax(period_min);
			assert.equal(carryover_max, '2017-03-01 05:59:59');
		});

		it('carryover_min of 2017-02-01 06:00:00 UTC', function() {
			carryover_min = Occasion._auditCarroverMin(carryover_max, interval_carry, tz);
			assert.equal(carryover_min, '2017-02-01 06:00:00');
		});
	});

	describe('Occasion.auditRecipe(`3/1/2017`)', function() {

		var tz = 'US/Central';
		var opened = '3/1/2017';
		var interval_open = '1 MONTHS';
		var interval_licet = '1 MONTHS';
		var interval_carry = '1 MONTHS';

		var recipe = Occasion.auditRecipe(opened, interval_open, interval_licet, interval_carry, tz);

		it('expect opened of 2017-03-01 06:00:00 UTC', function() {
			assert.equal(recipe.opened, '2017-03-01 06:00:00');
		});

		it('closes of 2017-04-01 04:59:59 UTC', function() {
			assert.equal(recipe.expired, '2017-04-01 04:59:59');
		});

		it('period_max of 2017-04-01 04:59:59 UTC', function() {
			assert.equal(recipe.period_max, '2017-04-01 04:59:59');
		});

		it('period_min of 2017-03-01 06:00:00 UTC', function() {
			assert.equal(recipe.period_min, '2017-03-01 06:00:00');
		});

		it('period_min equals opened', function() {
			assert.equal(recipe.period_min, recipe.opened);
		});

		it('carryover_max of 2017-03-01 05:59:59 UTC (one second before period_max)', function() {
			assert.equal(recipe.carryover_max, '2017-03-01 05:59:59');
		});

		it('carryover_min of 2017-02-01 06:00:00 UTC', function() {
			assert.equal(recipe.carryover_min, '2017-02-01 06:00:00');
		});
	});

	describe('Occasion.lessThan', function() {

		var smallValue = '2017-03';
		var largeValue = '2017-04';

		it('true for less than', function() {
			assert.equal(true, Occasion.lessThan(smallValue, largeValue));
		});

		it('false for less than', function() {
			assert.equal(false, Occasion.lessThan(largeValue, smallValue));
		});

		it('false for equal', function() {
			assert.equal(false, Occasion.lessThan(largeValue, largeValue));
		});
	});

	describe('Occasion.diff', function() {

		var smallValue = '2017-03-10';
		var largeValue = '2017-03-20';

		it('ten days difference', function() {
			assert.equal(10, Occasion.diff(smallValue, largeValue, 'days'));
		});
	});

	describe('Occasion.add', function() {

		it('ten days added to 2017-03-01', function() {
			assert.equal('2017-03-11', Occasion.add('2017-03-01', 10, 'days', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.subtract', function() {

		it('ten days difference', function() {
			assert.equal('2017-03-01', Occasion.subtract('2017-03-11', 10, 'days', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.endOf', function() {

		it('last day of month for 2017-12', function() {
			assert.equal('2017-12-31', Occasion.endOf('2017-12-01', 'month', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.startOf', function() {

		it('first day of month for 2017-12', function() {
			assert.equal('2017-12-01', Occasion.startOf('2017-12-10', 'month', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.zoneAbbr', function() {

		it('test for America/Chicago', function() {
			assert.equal('CST', Occasion.zoneAbbr('America/Chicago'));
		});
	});
});

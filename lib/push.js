'use strict';
var request = require('request');
var async = require('async');
var _ = require('lodash');
var Insight = require('./insight');

// Messaged on each debounced track()
// Gets the queue, merges is with the previous and tries to upload everything
// If it fails, it will save everything again
process.on('message', function(msg) {
	var insight = new Insight(msg);
	var config = insight.config;
	var q = config.get('queue') || {};

	_.extend(q, msg.queue);
	config.del('queue');

	async.forEachSeries(Object.keys(q), function(el, cb) {
		var parts = el.split(' ');
		var id = parts[0];
		var path = parts[1];
		var qs = parts[2];

		request(insight.getRequest(id, path, qs), function(error) {
			if (error) {
				return cb(error);
			}
			cb();
		});
	}, function(error) {
		if (error) {
			var q2 = config.get('queue') || {};
			_.extend(q2, q);
			config.set('queue', q2);
		}
		process.exit(0);
	});
});

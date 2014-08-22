var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

var async = require('async');
var _ = require('underscore');

var util = require('./util')

router.get('/projects/:id/groups', function(req, res) {
  var startDate = new Date( Number(req.query.startDate))
  var endDate = new Date( Number(req.query.endDate))
  var directives = req.query.directives
  var limit = Number(req.query.limit);
  var bucket = Number(req.query.bucket);

  if (!_.isArray(directives))
    directives = [directives];

  async.auto({
    project: function(next) {
      Project.findById(req.params.id, next)
    },

    groupBuckets: ['project', function(next, results) {
      var project = results.project;
      
      return util.aggregateGroups(startDate, endDate, directives, limit, bucket, project._id, next);
    }],

    groups: ['groupBuckets', function(next, results) {
      var groups = results.groupBuckets;

      for (var i = 0; i < groups.length; ++i) {
        groups[i].data = util.buckets(bucket, startDate, endDate, groups[i].data);
      }

      return next(null, groups);
    }]

  }, function(err, results) {
    res.json(results);
  });
});

module.exports = router;
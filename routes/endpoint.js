var express = require('express');
var route = express.Router();
var async = require('async');
var mongoose = require('mongoose');

var winston = require('../logger');

var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

route.post('/:id', function(req, res) {
  var id = req.params.id;

  async.auto({
    project: function(next) {
      Project.findById(id).exec(next)
    },

    report: ['project', function(next, results) {
      var project = results.project;
      if (project == undefined)
        return next("Project doesn't exist.");

      if (req.body.csp_report == undefined)
        return next('Not a valid report');

      var directive = req.body.csp_report.violated_directive;
      if (directive !== undefined && directive !== "") {
        directive = directive.split(' ')[0];
      }

      var e = new Report({
        ip: req.ip,
        project: project._id,
        raw: req.body.data,
        csp_report: req.body.csp_report, 
        directive: directive
      })

      e.save(next);
    }],

    updatePolicy: ['project', 'report', function(next, results) {
      var project = results.project;
      var report = results.report[0];

      if (report.csp_report.original_policy !== "")
        project.policy = report.csp_report.original_policy;

      project.save(next);
    }]

  }, function(err, results) {
    if (err) {
      winston.warn("ERROR - ", err);
      res.send(err, 400);
      return
    }

    res.send('Okay');
  })
})

module.exports = route
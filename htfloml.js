#!/usr/bin/env node
var fs = require('fs');
var gulp = require('gulp');
var watch = require('gulp-watch');
var HTFLOML = require('./dist/html-formatter.js');

var args = process.argv.slice(2);

var glob = args.slice(args.indexOf('-g'))[1];
var filePath = args.slice(args.indexOf('-f'))[1];
if (!filePath && !glob) {
  console.error('Use -f to supply a file path to format or -g to supply a glob to format');
  return;
}

var indentSize = args.slice(args.indexOf('-i'))[1] || 2;
var wrappingColumn = args.slice(args.indexOf('-w'))[1] || 100;

var formatter = new HTFLOML.HtmlFormatter(indentSize, wrappingColumn);

if (args.slice(args.indexOf('--watch')) === -1) {
  formatFile(filePath, formatter);
} else {
  let watchList = [glob, filePath].filter(a => a !== undefined);
  watchFiles(watchList, formatter);
}

'use strict';

var gulp = require('gulp');
var fs = require('fs');
var browserify  = require('browserify');
var source = require('vinyl-source-stream'); // makes browserify bundle compatible with gulp
var HTFLOML = require('./dist/html-formatter.js');

var browserifyFile = function(event) {
  browserify(event.path).bundle()
        .pipe(source(event.path.split('/').pop()))
        .pipe(gulp.dest('./test'));
}

var formatFile = function(filePath, formatter) {
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      console.log(err);
    } else {
      fs.writeFile(filePath, formatter.format(data), 'utf8');
    }
  });
}

var watchPath = function(path, formatter) {

  gulp.watch(path)
        .pipe(source(event.path.split('/').pop()))
        .pipe(gulp.dest('./test'));


  gulp.watch(glob, function(event) {
    formatFile(event.path, formatter);
    console.log(`Formatted ${event.path}`);
  });
});

gulp.task('test', function() {
  gulp.watch('./dist/*.js', browserifyFile);
 browserifyFile({path : './dist/html-formatter.spec.js'})
 browserifyFile({path: './dist/html-formatter.js'});
});
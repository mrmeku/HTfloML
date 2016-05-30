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

gulp.task('format', function() {
  var args = process.argv.slice(2);
  var filePath = args.slice(args.indexOf('-f'))[1];
  if (!filePath) {
    console.error('Use -f to supply a file path to  format');
  }
  var indentSize = args.slice(args.indexOf('-i'))[1] || 2;
  var wrappingColumn = args.slice(args.indexOf('-w'))[1] || 100 ;
  var formatter = new HTFLOML.HtmlFormatter(indentSize, wrappingColumn);
  formatFile(filePath, formatter);
});

gulp.task('watch', function(done) {
  var args = process.argv.slice(2);
  var glob = args.slice(args.indexOf('-g'))[1];
  if (!glob) {
    console.error('Use -g to supply a glob to watch and format');
  }

  var indentSize = args.slice(args.indexOf('-i'))[1] || 2;
  var wrappingColumn = args.slice(args.indexOf('-w'))[1] || 100 ;
  var formatter = new HTFLOML.HtmlFormatter(indentSize, wrappingColumn);

  watcher.on('change', function(path, stat) {
    // `path` is the path of the changed file
    // `stat` is an `fs.Stat` object (not always available)
  });

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
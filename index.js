'use strict';

var fs = require('fs');
var HTFLOML = require('./dist/html-formatter.js');

var args = process.argv.slice(2);

var filePath = args.slice(args.indexOf('-f'))[1];
if (!filePath) {
  console.error('Use -f to supply a file path to  format');
  return;
}

var indentSize = args.slice(args.indexOf('-i'))[1] || 2;
var wrappingColumn = args.slice(args.indexOf('-w'))[1] || 100 ;

var formatter = new HTFLOML.HtmlFormatter(indentSize, wrappingColumn);

fs.readFile(filePath, 'utf8', function (err, data) {
  if (err) {
    console.log(err);
  } else {
    fs.writeFile(filePath, formatter.format(data), 'utf8');
  }
});

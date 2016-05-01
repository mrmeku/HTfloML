HTFLOML
===========

This is an HTML formatter that I created for my buddy tflo. My friend has some very particular
rules about javascript that this formatter respects, namely:

 * Opening tag attributes should be broken up on to multiple lines if the opening tag would go past the wrapping column.
   * Attributes on new lines should be indented by four spaces.
 * Opening tags with broken up attributes should have their closing greater-than-sign on a new line.
 * Closing tags of empty elements should go onto the same line as an opening tag.
 * Elements that can fit onto one line without going past the wrapping column should.


Installation
------------

You need node.js and npm. You should probably install this globally.

**Npm way**

	npm install -g htfloml

**Manual way**

	git clone https://github.com/mrmeku/HTFLOML
	cd HTFLOML
	npm install # Local dependencies if you want to hack
	npm install -g # Install globally


Usage from command line
-----------------------

Issue the command `htfloml` with the -f flag to specify the path of an HTML file to format.

Optinal line parameters:

* `-w` - The wrapping column. Defaults to 100.
* `-i` - The indent size. Defaults to 2.


License
-------

Uses MIT licensed code from [Connect](https://github.com/senchalabs/connect/) and  [Roots](https://github.com/jenius/roots).

(MIT License)

Copyright (c) 2016 Daniel Muller

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

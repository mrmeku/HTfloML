HTFLOML
===========

This is an HTML formatter that I created for my tflo, hence H-tflo-ML.
It follows the following rules when formatting HTML.

 * Html has a character limit of 100. NOTE: You can set your own character limit with the -w flag
 * Html has an indent size of 2. NOTE: You can set your own indent size with the -i flag.
 Opening tags increment the indent level and closing tags decrement the indent level.
 * Opening tags are placed on one line they do not go passed the character limit.
 Otherwise, each attribute of the opening tag is wrapped onto its own line further indented by two levels.
 * Closing tags are placed immediately after opening tags if an element is empty if it would not go passed the character limit.
 Otherwise, a closing tag is placed onto its own line.
 * Leaf elements are placed on one line if it would not go passed the character limit.
 * Text is broken up into paragraphs delimited by a newline. Paragraph wrap onto newlines at character limit.


Installation
------------

You need node.js and npm. You probably install this globally.

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

* `-w` - The character limit / wrapping column. Defaults to 100.
* `-i` - The indent size. Defaults to 2.


License
-------

(MIT License)

Copyright (c) 2016 Daniel Muller

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

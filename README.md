HTFLOML
===========

An HTML formatter made for my buddy tflo (hence H-tflo-ML). It formats HTML according to the
following rules using a default character limit of 100 and an indent size of 2 spaces.

  * Opening tag placement
    * On a new line if shorter than the character limit.
    * Otherwise, place each attribute on a new line further indented by two levels.
  * Closing tag placement
    * Next to the opening tag if an empty element and it would not go passed the character limit.
    * Otherwise, on a new line.
  * Comment tag placement
    * On a new line if shorter than the character limit
    * Otherwise place the comment on a new line such that paragraphs (delimited by empty lines) wrap at the character limit.
  * Text node placement
    * On a new line if shorter than the character limit.
    * Otherwise place the text such that paragraphs (delimited by empty lines) wrap at the character limit.
  * Leaf elements placement
    * On a new line if shorter than the character limit.

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

Optional line parameters:

* `-w` - The character limit / wrapping column. Defaults to 100.
* `-i` - The indent size. Defaults to 2.


License
-------

(MIT License)

Copyright (c) 2016 Daniel Muller

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

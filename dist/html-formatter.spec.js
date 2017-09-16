"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
const html_formatter_1 = require("./html-formatter");
describe("html-formatter", () => {
    let htmlFormatter;
    beforeAll(() => {
        htmlFormatter = new html_formatter_1.HtmlFormatter(2, 100);
    });
    it("should format basic html", () => {
        expect(htmlFormatter.formatHtml(`
    <!DOCTYPE some string     that shouldn't     be

        altered >
<body class="something" other-class="meh" ng-if="1 > 2" >

tex text
<span @someWeirdAnimationBinding1="yoMamma"></span>
<span>asd
f
a<div>ad
f</div></span>

<custom-element-3 ng-if="1 < 2" class="one two three four five six seven eight twelve"></custom-element-3>
<custom-element-4 ng-if="1 < 2">
something
</custom-element-4>
<custom-element-5 ng-if="1 < 2" class="one two three four five six seven eight nine ten eleven twelve">

    something

456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
</custom-element-5>
<input type="text"></input>

<!-- some comment -->
<!--

6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 -->
<img src="http://img.com/image">

<span
class="one two three four five six seven eight nine ten eleven" ng-repeat="whatever in whateverList track by whatever"><
/  span>
</ body>`))
            .toEqual(`<!DOCTYPE some string that shouldn't be altered>
<body class="something" other-class="meh" ng-if="1 > 2">
  tex text
  <span @someWeirdAnimationBinding1="yoMamma"></span>
  <span>
    asd f a
    <div>ad f</div>
  </span>

  <custom-element-3 ng-if="1 < 2" class="one two three four five six seven eight twelve">
  </custom-element-3>
  <custom-element-4 ng-if="1 < 2">something</custom-element-4>
  <custom-element-5
      ng-if="1 < 2"
      class="one two three four five six seven eight nine ten eleven twelve"
  >
    something

    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
  </custom-element-5>
  <input type="text">

  <!-- some comment -->
  <!--
      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
  -->
  <img src="http://img.com/image">

  <span
      class="one two three four five six seven eight nine ten eleven"
      ng-repeat="whatever in whateverList track by whatever"
  ></span>
</body>
`);
    });
});

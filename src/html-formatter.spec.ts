/// <reference path="../typings/jasmine/jasmine.d.ts" />
import {HtmlFormatter, HtmlType} from "./html-formatter";

describe("html-formatter", () => {
  let htmlFormatter: HtmlFormatter;

  beforeAll(() => {
    htmlFormatter = new HtmlFormatter(2, 100);
  });

  it("should format basic html", () => {
    expect(htmlFormatter.formatHtml(`
    <!DOCTYPE some string     that shouldn't     be

        altered >
<body class="something" other-class="meh" ng-if="1 > 2" >

tex text
<span></span>
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
  <span></span>
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

  it("should insert opening tags", function () {
    expect(htmlFormatter.insertOpeningTag("<body>", "<html>", 1))
      .toEqual("<html>\n  <body>")

    expect(htmlFormatter.insertOpeningTag(`<body class="classname">`, "<html>", 1))
      .toEqual(`<html>\n  <body class="classname">`)
  });

  it("should recognize text nodes", function () {
    expect(HtmlFormatter
      .getHtmlType("        tex text      "))
      .toBe(HtmlType.TEXT_NODE);

    expect(HtmlFormatter.getHtmlType("text"))
      .toBe(HtmlType.TEXT_NODE);
  });

  it("should recognize commest nodes", function () {
    expect(HtmlFormatter
      .getHtmlType("<!-- I'm a comment look at me -->"))
      .toBe(HtmlType.COMMENT_TAG);

    expect(HtmlFormatter.getHtmlType("    <!-- 1 > 2 && 2 < 1 -->   "))
      .toBe(HtmlType.COMMENT_TAG);
  });

  it("should recognize opening tags", function () {
    expect(HtmlFormatter
      .getHtmlType(`<body class="something" other-class="meh">`))
      .toBe(HtmlType.OPENING_TAG);

    expect(HtmlFormatter.getHtmlType("<body>"))
      .toBe(HtmlType.OPENING_TAG);
  });

  it("should recognize closing tags", function () {
    expect(HtmlFormatter
      .getHtmlType("</body>"))
      .toBe(HtmlType.CLOSING_TAG);

    expect(HtmlFormatter.getHtmlType("</ body>"))
      .toBe(HtmlType.CLOSING_TAG);
  });
});
/// <reference path="../typings/jasmine/jasmine.d.ts" />
import {HtmlFormatter, HtmlTagType} from "./html-formatter";

describe("html-formatter", () => {
  let formatter: HtmlFormatter;

  beforeAll(() => {
    formatter = new HtmlFormatter(2, 100);
  });

  it("should format basic html", () => {
    expect(formatter.format(`
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
      .toEqual(`<body class="something" other-class="meh" ng-if="1 > 2">
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
    expect(formatter.insertOpeningTag("<body>", "<html>", 1))
      .toEqual("<html>\n  <body>")

    expect(formatter.insertOpeningTag(`<body class="classname">`, "<html>", 1))
      .toEqual(`<html>\n  <body class="classname">`)
  });

  it("should recognize text nodes", function () {
    expect(HtmlFormatter
      .getHtmlTagType("        tex text      "))
      .toBe(HtmlTagType.CONTENT);

    expect(HtmlFormatter.getHtmlTagType("text"))
      .toBe(HtmlTagType.CONTENT);
  });

  it("should recognize commest nodes", function () {
    expect(HtmlFormatter
      .getHtmlTagType("<!-- I'm a comment look at me -->"))
      .toBe(HtmlTagType.COMMENT);

    expect(HtmlFormatter.getHtmlTagType("    <!-- 1 > 2 && 2 < 1 -->   "))
      .toBe(HtmlTagType.COMMENT);
  });

  it("should recognize opening tags", function () {
    expect(HtmlFormatter
      .getHtmlTagType(`<body class="something" other-class="meh">`))
      .toBe(HtmlTagType.OPENING);

    expect(HtmlFormatter.getHtmlTagType("<body>"))
      .toBe(HtmlTagType.OPENING);
  });

  it("should recognize closing tags", function () {
    expect(HtmlFormatter
      .getHtmlTagType("</body>"))
      .toBe(HtmlTagType.CLOSING);

    expect(HtmlFormatter.getHtmlTagType("</ body>"))
      .toBe(HtmlTagType.CLOSING);
  });
});
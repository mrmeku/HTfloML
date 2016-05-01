"use strict";
const html_formatter_1 = require("./html-formatter");
describe("html-formatter", () => {
    let formatter;
    beforeAll(() => {
        formatter = new html_formatter_1.HtmlFormatter(2, 120);
    });
    it("should format basic html", () => {
        expect(formatter.format(`
<body class="something" other-class="meh" ng-if="1 > 2" >

tex text
<span></span>

<custom-element-4 ng-if="1 < 2">
something
</custom-element-4>
<custom-element-5 ng-if="1 < 2" class="one two three four five six seven eight nine ten eleven twelve thirteen fourteen">


    something


</custom-element-5>

<!-- some comment -->
<img src="http://img.com/image">

<span
class="one two three four five six seven eight nine ten eleven" ng-repeat="whatever in whateverList track by whatever"></span></body>`))
            .toEqual(`<body class="something" other-class="meh" ng-if="1 > 2">
  tex text
  <span></span>

  <custom-element-4 ng-if="1 < 2">something</custom-element-4>
  <custom-element-5
      ng-if="1 < 2"
      class="one two three four five six seven eight nine ten eleven twelve thirteen fourteen"
  >
    something
  </custom-element-5>

  <!-- some comment -->
  <img src="http://img.com/image">

  <span
      class="one two three four five six seven eight nine ten eleven"
      ng-repeat="whatever in whateverList track by whatever"
  ></span>
</body>
`);
    });
    it("should insert at appropriate depth", function () {
        expect(formatter.insertAtIndentationLevel("some text", "formatted", 2))
            .toEqual("formatted\n    some text");
    });
    it("should insert opening tags", function () {
        expect(formatter.insertOpeningTag("<body>", "body", "<html>", 1))
            .toEqual("<html>\n  <body>");
        expect(formatter.insertOpeningTag(`<body class="classname">`, "body", "<html>", 1))
            .toEqual(`<html>\n  <body class="classname">`);
    });
    it("should recognize text nodes", function () {
        expect(html_formatter_1.HtmlFormatter
            .getLineType("        tex text      "))
            .toBe(html_formatter_1.HtmlFormatter.LineType.TEXT);
        expect(html_formatter_1.HtmlFormatter.getLineType("text"))
            .toBe(html_formatter_1.HtmlFormatter.LineType.TEXT);
    });
    it("should recognize opening tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getLineType(`<body class="something" other-class="meh">`))
            .toBe(html_formatter_1.HtmlFormatter.LineType.OPENING_TAG);
        expect(html_formatter_1.HtmlFormatter.getLineType("<body>"))
            .toBe(html_formatter_1.HtmlFormatter.LineType.OPENING_TAG);
    });
    it("should recognize closing tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getLineType("</body>"))
            .toBe(html_formatter_1.HtmlFormatter.LineType.CLOSING_TAG);
        expect(html_formatter_1.HtmlFormatter.getLineType("</ body>"))
            .toBe(html_formatter_1.HtmlFormatter.LineType.CLOSING_TAG);
    });
});
//# sourceMappingURL=html-formatter.spec.js.map
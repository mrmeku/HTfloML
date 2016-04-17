describe("html-formatter", () => {
    var formatter;
    beforeAll(() => {
        formatter = new HtmlFormatter(2, 120);
    });
    it("should format basic html", () => {
        expect(formatter.format(`
<body class="something" other-class="meh">

tex text
<span></span>

<span>
something
</span>

<!-- some comment -->
<img src="http://img.com/image">

<span
class="one two three four five six seven eight nine ten eleven" ng-repeat="whatever in whateverList track by whatever"></span></body>`))
            .toEqual(`
<body class="something" other-class="meh">
  tex text
  <span></span>

  <span>
    something
  </span>

  <!-- some comment -->
  <img src="http://img.com/image">

  <span
      class="one two three four five six seven eight nine ten eleven"
      ng-repeat="whatever in whateverList track by whatever"
  ></span>
</body>
`.trim());
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
        expect(HtmlFormatter
            .getLineType("        tex text      "))
            .toBe(LineType.TEXT);
        expect(HtmlFormatter.getLineType("text"))
            .toBe(LineType.TEXT);
    });
    it("should recognize opening tags", function () {
        expect(HtmlFormatter
            .getLineType(`<body class="something" other-class="meh">`))
            .toBe(LineType.OPENING_TAG);
        expect(HtmlFormatter.getLineType("<body>"))
            .toBe(LineType.OPENING_TAG);
    });
    it("should recognize closing tags", function () {
        expect(HtmlFormatter
            .getLineType("</body>"))
            .toBe(LineType.CLOSING_TAG);
        expect(HtmlFormatter.getLineType("</ body>"))
            .toBe(LineType.CLOSING_TAG);
    });
});
//# sourceMappingURL=html-formatter.spec.js.map
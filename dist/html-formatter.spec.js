"use strict";
var html_formatter_1 = require("./html-formatter");
describe("html-formatter", function () {
    var formatter;
    beforeAll(function () {
        formatter = new html_formatter_1.HtmlFormatter(2, 120);
    });
    it("should format basic html", function () {
        expect(formatter.format("\n<body class=\"something\" other-class=\"meh\">\n\ntex text\n<span></span>\n\n<span>\nsomething\n</span>\n\n<!-- some comment -->\n<img src=\"http://img.com/image\">\n\n<span\nclass=\"one two three four five six seven eight nine ten eleven\" ng-repeat=\"whatever in whateverList track by whatever\"></span></body>"))
            .toEqual("\n<body class=\"something\" other-class=\"meh\">\n  tex text\n  <span></span>\n\n  <span>\n    something\n  </span>\n\n  <!-- some comment -->\n  <img src=\"http://img.com/image\">\n\n  <span\n      class=\"one two three four five six seven eight nine ten eleven\"\n      ng-repeat=\"whatever in whateverList track by whatever\"\n  ></span>\n</body>\n".trim());
    });
    it("should insert at appropriate depth", function () {
        expect(formatter.insertAtIndentationLevel("some text", "formatted", 2))
            .toEqual("formatted\n    some text");
    });
    it("should insert opening tags", function () {
        expect(formatter.insertOpeningTag("<body>", "body", "<html>", 1))
            .toEqual("<html>\n  <body>");
        expect(formatter.insertOpeningTag("<body class=\"classname\">", "body", "<html>", 1))
            .toEqual("<html>\n  <body class=\"classname\">");
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
            .getLineType("<body class=\"something\" other-class=\"meh\">"))
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
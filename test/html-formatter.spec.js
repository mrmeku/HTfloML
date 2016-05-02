(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
;
class HtmlFormatter {
    constructor(indentSize, wrappingColumn) {
        this.indentSize = indentSize;
        this.wrappingColumn = wrappingColumn;
    }
    static getLineType(line) {
        if (line.trim() === "") {
            return 4;
        }
        if (line.match(HtmlFormatter.OPENING_TAG_REGEX)) {
            return 0;
        }
        if (line.match(HtmlFormatter.CLOSING_TAG_REGEX)) {
            return 1;
        }
        if (line.match(HtmlFormatter.COMMENT_TAG_REGEX)) {
            return 2;
        }
        return 3;
    }
    insertAtIndentationLevel(textToInsert, formattedHtml, indentLevel) {
        formattedHtml += "\n";
        let spacesInserted = 0;
        while (spacesInserted < this.indentSize * indentLevel) {
            formattedHtml += " ";
            ++spacesInserted;
        }
        formattedHtml += textToInsert;
        return formattedHtml;
    }
    insertOpeningTag(openingTag, tagName, formattedHtml, indentLevel) {
        let attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HtmlFormatter.ATTRIBUTE_REGEX);
        let formattedOpeningTag = attributes && attributes.length ?
            `<${tagName} ${attributes.join(" ")}>` :
            `<${tagName}>`;
        if (indentLevel * this.indentSize + formattedOpeningTag.length <= this.wrappingColumn) {
            return this.insertAtIndentationLevel(formattedOpeningTag, formattedHtml, indentLevel);
        }
        else {
            formattedHtml = this.insertAtIndentationLevel(`<${tagName}`, formattedHtml, indentLevel);
            attributes.forEach(attribute => {
                formattedHtml = this.insertAtIndentationLevel(attribute, formattedHtml, indentLevel + 2);
            });
            return this.insertAtIndentationLevel(">", formattedHtml, indentLevel);
        }
    }
    insertClosingTag(closingTag, tagName, formattedHtml, indentLevel, previousLineType) {
        let formattedClosingTag = closingTag.replace(HtmlFormatter.WHITESPACE_REGEX, "");
        let openingTagIndex = formattedHtml.lastIndexOf(`<${tagName}`);
        let element = formattedHtml
            .slice(openingTagIndex)
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .map(line => line.trim())
            .join("") + formattedClosingTag;
        if (previousLineType == 0 ||
            element.match(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX).length === 2 &&
                indentLevel * this.indentSize + element.length <= this.wrappingColumn) {
            return formattedHtml.slice(0, openingTagIndex) + element;
        }
        return this.insertAtIndentationLevel(formattedClosingTag, formattedHtml, indentLevel);
    }
    format(html) {
        let formattedHtml = "";
        let indentLevel = 0;
        let previousLineType = 4;
        html
            .trim()
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .filter((line) => line !== "")
            .forEach(line => {
            let lineType = HtmlFormatter.getLineType(line);
            let tagName = "";
            switch (lineType) {
                case 0:
                    tagName = line.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
                    formattedHtml = this.insertOpeningTag(line, tagName, formattedHtml, indentLevel);
                    indentLevel += HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName) ? 0 : 1;
                    break;
                case 1:
                    tagName = line.match(HtmlFormatter.CLOSING_TAG_REGEX)[1];
                    if (!HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName)) {
                        --indentLevel;
                        formattedHtml = this.insertClosingTag(line, tagName, formattedHtml, indentLevel, previousLineType);
                    }
                    break;
                case 2:
                case 3:
                    formattedHtml = this.insertAtIndentationLevel(line.trim(), formattedHtml, indentLevel);
                    break;
                case 4:
                    for (let i = 0; i < line.split("\n").length - 2; i++) {
                        formattedHtml += "\n";
                    }
                    lineType = previousLineType;
                    break;
            }
            previousLineType = lineType;
        });
        return formattedHtml.trim() + "\n";
    }
}
HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g;
HtmlFormatter.OPENING_TAG_REGEX = /<[\s\n]*([a-zA-Z0-9-]+)[\S\s]*>/;
HtmlFormatter.CLOSING_TAG_REGEX = /<[\s\n]*\/[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
HtmlFormatter.COMMENT_TAG_REGEX = /<!--[\S\s]*?-->/;
HtmlFormatter.WHITESPACE_REGEX = /[\s\n]+/;
HtmlFormatter.ATTRIBUTE_REGEX = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
HtmlFormatter.VOID_ELEMENT_NAMES = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
exports.HtmlFormatter = HtmlFormatter;

},{}],2:[function(require,module,exports){
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
<span>asdfa<div>adf</div></span>

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
  <span>
    asdfa
    <div>adf</div>
  </span>

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
            .toBe(3);
        expect(html_formatter_1.HtmlFormatter.getLineType("text"))
            .toBe(3);
    });
    it("should recognize opening tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getLineType(`<body class="something" other-class="meh">`))
            .toBe(0);
        expect(html_formatter_1.HtmlFormatter.getLineType("<body>"))
            .toBe(0);
    });
    it("should recognize closing tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getLineType("</body>"))
            .toBe(1);
        expect(html_formatter_1.HtmlFormatter.getLineType("</ body>"))
            .toBe(1);
    });
});

},{"./html-formatter":1}]},{},[2]);

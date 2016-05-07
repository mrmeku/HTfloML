(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
class HtmlFormatter {
    constructor(indentSize, wrappingColumn) {
        this.indentSize = indentSize;
        this.wrappingColumn = wrappingColumn;
    }
    static getTagName(tag) {
        let openingTagName = tag.match(HtmlFormatter.OPENING_TAG_REGEX);
        let closingTagName = tag.match(HtmlFormatter.CLOSING_TAG_REGEX);
        return openingTagName ? openingTagName[1] : closingTagName ? closingTagName[1] : null;
    }
    static getLineType(line) {
        let tagName = HtmlFormatter.getTagName(line);
        return HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName) ? 3 :
            HtmlFormatter.COMMENT_TAG_REGEX.test(line) ? 2 :
                HtmlFormatter.CLOSING_TAG_REGEX.test(line) ? 1 :
                    HtmlFormatter.OPENING_TAG_REGEX.test(line) ? 0 :
                        line.trim() === "" ? 5 : 4;
    }
    static replaceWhiteSpace(text, replaceWhiteSpaceWith) {
        return text.replace(HtmlFormatter.WHITESPACE_REGEX, replaceWhiteSpaceWith).trim();
    }
    isShorterThanWrappingColumn(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.wrappingColumn;
    }
    insertAtIndentLevel(textToInsert, html, indentLevel) {
        html += "\n";
        for (let indent = 0; indent < this.indentSize * indentLevel; indent++) {
            html += " ";
        }
        html += textToInsert;
        return html;
    }
    insertOpeningTag(openingTag, html, indentLevel) {
        let tagName = HtmlFormatter.getTagName(openingTag);
        let attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HtmlFormatter.ATTRIBUTE_REGEX) || [];
        let oneLineOpeningTag = attributes && attributes.length ?
            `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
        if (this.isShorterThanWrappingColumn(oneLineOpeningTag, indentLevel)) {
            return this.insertAtIndentLevel(oneLineOpeningTag, html, indentLevel);
        }
        html = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
        attributes.forEach(attribute => {
            html = this.insertAtIndentLevel(attribute, html, indentLevel + 2);
        });
        return this.insertAtIndentLevel(">", html, indentLevel);
    }
    insertClosingTag(closingTag, html, indentLevel, preceededByOpeningTag) {
        closingTag = HtmlFormatter.replaceWhiteSpace(closingTag, "");
        if (preceededByOpeningTag) {
            return html + closingTag;
        }
        let indexOfOpeningTag = html.lastIndexOf(`<${HtmlFormatter.getTagName(closingTag)}`);
        let normalizedElement = html
            .slice(indexOfOpeningTag)
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
            .join("") + closingTag;
        if (normalizedElement.match(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX).length === 2 &&
            this.isShorterThanWrappingColumn(normalizedElement, indentLevel)) {
            return html.slice(0, indexOfOpeningTag) + normalizedElement;
        }
        return this.insertAtIndentLevel(closingTag, html, indentLevel);
    }
    insertText(text, html, indentLevel) {
        let normalizedText = HtmlFormatter.replaceWhiteSpace(text, " ");
        text = this.isShorterThanWrappingColumn(normalizedText, indentLevel) ? normalizedText : text;
        return this.insertAtIndentLevel(text.trim(), html, indentLevel);
    }
    format(unformattedHtml) {
        let html = "";
        let indentLevel = 0;
        let preceededByOpeningTag = false;
        unformattedHtml
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .forEach(line => {
            let lineType = HtmlFormatter.getLineType(line);
            switch (lineType) {
                case 3:
                    html = this.insertOpeningTag(line, html, indentLevel);
                    break;
                case 0:
                    html = this.insertOpeningTag(line, html, indentLevel);
                    ++indentLevel;
                    break;
                case 1:
                    --indentLevel;
                    html = this.insertClosingTag(line, html, indentLevel, preceededByOpeningTag);
                    break;
                case 2:
                case 4:
                    html = this.insertText(line, html, indentLevel);
                    break;
                case 5:
                    for (let newlines = 0; newlines < line.split("\n").length - 2; newlines++) {
                        html += "\n";
                    }
                    break;
            }
            preceededByOpeningTag = lineType === 0 ||
                lineType === 5 && preceededByOpeningTag;
        });
        return html.trim() + "\n";
    }
}
HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g;
HtmlFormatter.OPENING_TAG_REGEX = /<[\s\n]*([a-zA-Z0-9-]+)[\S\s]*>/;
HtmlFormatter.CLOSING_TAG_REGEX = /<[\s\n]*\/[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
HtmlFormatter.COMMENT_TAG_REGEX = /<!--[\S\s]*?-->/;
HtmlFormatter.WHITESPACE_REGEX = /[\s\n]+/g;
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
        formatter = new html_formatter_1.HtmlFormatter(2, 100);
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

<custom-element-4 ng-if="1 < 2">
something
</custom-element-4>
<custom-element-5 ng-if="1 < 2" class="one two three four five six seven eight nine ten eleven twelve">

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
    asd f a
    <div>ad f</div>
  </span>

  <custom-element-4 ng-if="1 < 2">something</custom-element-4>
  <custom-element-5
      ng-if="1 < 2"
      class="one two three four five six seven eight nine ten eleven twelve"
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
        expect(formatter.insertAtIndentLevel("some text", "formatted", 2))
            .toEqual("formatted\n    some text");
    });
    it("should insert opening tags", function () {
        expect(formatter.insertOpeningTag("<body>", "<html>", 1))
            .toEqual("<html>\n  <body>");
        expect(formatter.insertOpeningTag(`<body class="classname">`, "<html>", 1))
            .toEqual(`<html>\n  <body class="classname">`);
    });
    it("should recognize text nodes", function () {
        expect(html_formatter_1.HtmlFormatter
            .getLineType("        tex text      "))
            .toBe(4);
        expect(html_formatter_1.HtmlFormatter.getLineType("text"))
            .toBe(4);
    });
    it("should recognize commest nodes", function () {
        expect(html_formatter_1.HtmlFormatter
            .getLineType("<!-- I'm a comment look at me -->"))
            .toBe(2);
        expect(html_formatter_1.HtmlFormatter.getLineType("    <!-- 1 > 2 && 2 < 1 -->   "))
            .toBe(2);
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

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
class HtmlFormatter {
    constructor(indentSize, characterLimit) {
        this.indentSize = indentSize;
        this.chracterLimit = characterLimit;
    }
    static getTagName(tag) {
        let tagNameMatch = tag.match(HtmlFormatter.TAG_NAME_REGEX);
        return tagNameMatch ? tagNameMatch[1] : "";
    }
    static getLineType(line) {
        return (HtmlFormatter.VOID_ELEMENT_NAMES.has(HtmlFormatter.getTagName(line)) ? 3 :
            HtmlFormatter.COMMENT_TAG_REGEX.test(line) ? 2 :
                HtmlFormatter.CLOSING_TAG_REGEX.test(line) ? 1 :
                    HtmlFormatter.OPENING_TAG_REGEX.test(line) ? 0 :
                        line.trim() === "" ? 5 : 4);
    }
    static replaceWhiteSpace(text, replaceWhiteSpaceWith) {
        return text.replace(HtmlFormatter.WHITESPACE_REGEX, replaceWhiteSpaceWith).trim();
    }
    isShorterThanCharacterLimit(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.chracterLimit;
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
        let oneLineOpeningTag = attributes.length > 0 ?
            `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
        if (this.isShorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
            return this.insertAtIndentLevel(oneLineOpeningTag, html, indentLevel);
        }
        let htmlWithTagName = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
        let htmlWithAttributes = attributes.reduce((html, attribute) => this.insertAtIndentLevel(attribute, html, indentLevel + 2), htmlWithTagName);
        return this.insertAtIndentLevel(">", htmlWithAttributes, indentLevel);
    }
    insertClosingTag(closingTag, html, indentLevel) {
        let tagName = HtmlFormatter.getTagName(closingTag);
        let trimmedHtml = html.trim();
        closingTag = `</${tagName}>`;
        let openingTagIndex = trimmedHtml.lastIndexOf(`<${tagName}`);
        let elementLines = trimmedHtml
            .slice(openingTagIndex)
            .split(HtmlFormatter.HTML_TAG_REGEX)
            .filter(line => line.trim() !== "");
        let oneLineElement = elementLines
            .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
            .join("") + closingTag;
        if (this.isShorterThanCharacterLimit(oneLineElement, indentLevel) &&
            oneLineElement.match(HtmlFormatter.HTML_TAG_REGEX).length === 2) {
            return trimmedHtml.slice(0, openingTagIndex) + oneLineElement;
        }
        let endingTagLine = trimmedHtml.slice(trimmedHtml.lastIndexOf("\n")) + closingTag;
        let openingTag = elementLines[0];
        let preceededByOpeningTag = trimmedHtml.length <= openingTagIndex + openingTag.length + 1;
        if (preceededByOpeningTag && this.isShorterThanCharacterLimit(endingTagLine, indentLevel)) {
            return trimmedHtml + closingTag;
        }
        return this.insertAtIndentLevel(closingTag, trimmedHtml, indentLevel);
    }
    insertCommentTag(commentTag, html, indentLevel) {
        let comment = commentTag.trim().slice(4, -3);
        let oneLineCommentTag = `<!-- ${HtmlFormatter.replaceWhiteSpace(comment, " ")} -->`;
        if (this.isShorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
            return this.insertAtIndentLevel(oneLineCommentTag, html, indentLevel);
        }
        let htmlWithCommentOpening = this.insertAtIndentLevel("<!--", html, indentLevel);
        let htmlWithComment = this.insertText(comment, htmlWithCommentOpening, indentLevel + 2);
        return this.insertAtIndentLevel("-->", htmlWithComment, indentLevel);
    }
    insertText(text, html, indentLevel) {
        let oneLineText = HtmlFormatter.replaceWhiteSpace(text, " ").trim();
        if (this.isShorterThanCharacterLimit(oneLineText, indentLevel)) {
            return this.insertAtIndentLevel(oneLineText, html, indentLevel);
        }
        let formattedText = text
            .split(HtmlFormatter.PARAGRAPH_DELIMITER_REGEX)
            .map(paragraph => {
            return paragraph
                .split(HtmlFormatter.WHITESPACE_REGEX)
                .reduce((formattedParagraph, word) => {
                let lastLine = formattedParagraph.slice(formattedParagraph.lastIndexOf("\n"));
                if (this.isShorterThanCharacterLimit(lastLine, indentLevel)) {
                    return formattedParagraph + (lastLine.trim() === "" ? word : ` ${word}`);
                }
                return this.insertAtIndentLevel(word, formattedParagraph, indentLevel);
            }, this.insertAtIndentLevel("", "", indentLevel));
        })
            .join("\n")
            .trim();
        return this.insertAtIndentLevel(formattedText, html, indentLevel);
    }
    insertWhiteSpace(whitespace, html) {
        for (let newlines = 0; newlines < whitespace.split("\n").length - 2; newlines++) {
            html += "\n";
        }
        return html;
    }
    insertVoidTag(voidTag, html, indentLevel) {
        return HtmlFormatter.CLOSING_TAG_REGEX.test(voidTag)
            ? html
            : this.insertOpeningTag(voidTag, html, indentLevel);
    }
    format(unformattedHtml) {
        let indentLevel = 0;
        return unformattedHtml
            .split(HtmlFormatter.HTML_TAG_REGEX)
            .reduce((html, line) => {
            switch (HtmlFormatter.getLineType(line)) {
                case 0:
                    return this.insertOpeningTag(line, html, indentLevel++);
                case 1:
                    return this.insertClosingTag(line, html, --indentLevel);
                case 3:
                    return this.insertVoidTag(line, html, indentLevel);
                case 2:
                    return this.insertCommentTag(line, html, indentLevel);
                case 4:
                    return this.insertText(line, html, indentLevel);
                case 5:
                    return this.insertWhiteSpace(line, html);
                default:
                    return html;
            }
        }, "")
            .trim() + "\n";
    }
}
HtmlFormatter.HTML_TAG_REGEX = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g;
HtmlFormatter.OPENING_TAG_REGEX = /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/;
HtmlFormatter.CLOSING_TAG_REGEX = /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/;
HtmlFormatter.TAG_NAME_REGEX = /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
HtmlFormatter.COMMENT_TAG_REGEX = /<!--[\S\s]*?-->/;
HtmlFormatter.WHITESPACE_REGEX = /[\s\n]+/g;
HtmlFormatter.PARAGRAPH_DELIMITER_REGEX = /\n[\s\n]*/;
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

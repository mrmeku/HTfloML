(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
class HtmlFormatter {
    constructor(indentSize, characterLimit) {
        this.indentSize = indentSize;
        this.chracterLimit = characterLimit;
    }
    format(unformattedHtml) {
        let indentLevel = 0;
        return unformattedHtml
            .split(HtmlRegExp.CAPTURE_TAGS)
            .reduce((html, tag) => {
            switch (HtmlFormatter.getHtmlTagType(tag)) {
                case 5: return this.insertWhiteSpace(tag, html);
                case 0: return this.insertOpeningTag(tag, html, indentLevel++);
                case 1: return this.insertClosingTag(tag, html, --indentLevel);
                case 2: return this.insertVoidTag(tag, html, indentLevel);
                case 3: return this.insertCommentTag(tag, html, indentLevel);
                case 4: return this.insertContent(tag, html, indentLevel);
                default: return html;
            }
        }, "")
            .trim() + "\n";
    }
    insertWhiteSpace(whitespace, html) {
        return html + (whitespace.match(/\n/g) || []).slice(1).join("");
    }
    insertOpeningTag(openingTag, html, indentLevel) {
        let tagName = HtmlFormatter.getTagName(openingTag);
        let attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HtmlRegExp.ATTRIBUTE);
        let oneLineOpeningTag = attributes ? `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
        if (this.isShorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
            return this.insertAtIndentLevel(oneLineOpeningTag, html, indentLevel);
        }
        let htmlWithTagName = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
        let htmlWithAttributes = attributes.reduce((html, attribute) => this.insertAtIndentLevel(attribute, html, indentLevel + 2), htmlWithTagName);
        return this.insertAtIndentLevel(">", htmlWithAttributes, indentLevel);
    }
    insertClosingTag(closingTag, html, indentLevel) {
        let tagName = HtmlFormatter.getTagName(closingTag);
        let formattedClosingTag = `</${tagName}>`;
        let trimmedHtml = html.trim();
        let elementStartIndex = trimmedHtml.lastIndexOf(`<${tagName}`);
        let unclosedElement = trimmedHtml.slice(elementStartIndex);
        let oneLineElement = unclosedElement
            .split("\n")
            .map(HtmlFormatter.normalizeSpace)
            .join("") + formattedClosingTag;
        let isLeafElement = oneLineElement.match(HtmlRegExp.CAPTURE_TAGS).length === 2;
        if (isLeafElement) {
            if (this.isShorterThanCharacterLimit(oneLineElement, indentLevel)) {
                return trimmedHtml.slice(0, elementStartIndex) + oneLineElement;
            }
        }
        let openingTag = unclosedElement.match(HtmlRegExp.OPENING_TAG)[0];
        let elementIsEmpty = trimmedHtml.length === elementStartIndex + openingTag.length;
        if (elementIsEmpty) {
            let lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(html);
            if (this.isShorterThanCharacterLimit(lastLineTrimmed + formattedClosingTag, indentLevel)) {
                return trimmedHtml + formattedClosingTag;
            }
        }
        return this.insertAtIndentLevel(formattedClosingTag, trimmedHtml, indentLevel);
    }
    insertVoidTag(voidTag, html, indentLevel) {
        return HtmlRegExp.CLOSING_TAG.test(voidTag)
            ? html
            : this.insertOpeningTag(voidTag, html, indentLevel);
    }
    insertCommentTag(commentTag, html, indentLevel) {
        let comment = commentTag.trim().slice(4, -3);
        let oneLineCommentTag = `<!-- ${HtmlFormatter.normalizeSpace(comment)} -->`;
        if (this.isShorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
            return this.insertAtIndentLevel(oneLineCommentTag, html, indentLevel);
        }
        let htmlWithCommentOpening = this.insertAtIndentLevel("<!--", html, indentLevel);
        let htmlWithComment = this.insertContent(comment, htmlWithCommentOpening, indentLevel + 2);
        return this.insertAtIndentLevel("-->", htmlWithComment, indentLevel);
    }
    insertContent(content, html, indentLevel) {
        let oneLineText = HtmlFormatter.normalizeSpace(content);
        if (this.isShorterThanCharacterLimit(oneLineText, indentLevel)) {
            return this.insertAtIndentLevel(oneLineText, html, indentLevel);
        }
        let formattedContent = content
            .split(HtmlRegExp.PARAGRAPH_DELIMITER)
            .map(paragraph => {
            return paragraph
                .split(HtmlRegExp.WHITESPACE)
                .reduce((formattedParagraph, word) => {
                let lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(formattedParagraph);
                let indentedWord = lastLineTrimmed === "" ? word : " " + word;
                if (this.isShorterThanCharacterLimit(lastLineTrimmed + indentedWord, indentLevel)) {
                    return formattedParagraph + indentedWord;
                }
                return this.insertAtIndentLevel(word, formattedParagraph, indentLevel);
            }, this.insertAtIndentLevel("", "", indentLevel));
        })
            .join("\n")
            .trim();
        return this.insertAtIndentLevel(formattedContent, html, indentLevel);
    }
    static getHtmlTagType(text) {
        return VoidTagNames.has(HtmlFormatter.getTagName(text)) ? 2 :
            HtmlRegExp.COMMENT_TAG.test(text) ? 3 :
                HtmlRegExp.CLOSING_TAG.test(text) ? 1 :
                    HtmlRegExp.OPENING_TAG.test(text) ? 0 :
                        text.trim() === "" ? 5 :
                            4;
    }
    static getTagName(tag) {
        let tagNameMatch = tag.match(HtmlRegExp.TAG_NAME);
        return tagNameMatch ? tagNameMatch[1] : "";
    }
    static normalizeSpace(text) {
        return text.replace(HtmlRegExp.WHITESPACE, " ").trim();
    }
    static getLastLineTrimmed(text) {
        return text.slice(Math.max(text.lastIndexOf("\n"), 0)).trim();
    }
    ;
    insertAtIndentLevel(textToInsert, html, indentLevel) {
        let indent = Array(this.indentSize * indentLevel + 1).join(" ");
        return `${html}\n${indent}${textToInsert}`;
    }
    isShorterThanCharacterLimit(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.chracterLimit;
    }
}
exports.HtmlFormatter = HtmlFormatter;
const VoidTagNames = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
const HtmlRegExp = {
    CAPTURE_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
    OPENING_TAG: /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    CLOSING_TAG: /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    TAG_NAME: /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/,
    COMMENT_TAG: /<!--[\S\s]*?-->/,
    WHITESPACE: /[\s\n]+/g,
    PARAGRAPH_DELIMITER: /\n[\s\n]*\n/,
    ATTRIBUTE: /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};

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
    it("should insert opening tags", function () {
        expect(formatter.insertOpeningTag("<body>", "<html>", 1))
            .toEqual("<html>\n  <body>");
        expect(formatter.insertOpeningTag(`<body class="classname">`, "<html>", 1))
            .toEqual(`<html>\n  <body class="classname">`);
    });
    it("should recognize text nodes", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlTagType("        tex text      "))
            .toBe(4);
        expect(html_formatter_1.HtmlFormatter.getHtmlTagType("text"))
            .toBe(4);
    });
    it("should recognize commest nodes", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlTagType("<!-- I'm a comment look at me -->"))
            .toBe(3);
        expect(html_formatter_1.HtmlFormatter.getHtmlTagType("    <!-- 1 > 2 && 2 < 1 -->   "))
            .toBe(3);
    });
    it("should recognize opening tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlTagType(`<body class="something" other-class="meh">`))
            .toBe(0);
        expect(html_formatter_1.HtmlFormatter.getHtmlTagType("<body>"))
            .toBe(0);
    });
    it("should recognize closing tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlTagType("</body>"))
            .toBe(1);
        expect(html_formatter_1.HtmlFormatter.getHtmlTagType("</ body>"))
            .toBe(1);
    });
});

},{"./html-formatter":1}]},{},[2]);

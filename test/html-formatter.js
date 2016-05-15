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
        if (this.isShorterThanCharacterLimit(oneLineOpeningTag + `</${tagName}>`, indentLevel)) {
            return this.insertAtIndentLevel(oneLineOpeningTag, html, indentLevel);
        }
        let htmlWithTagName = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
        let htmlWithAttributes = attributes.reduce((html, attribute) => this.insertAtIndentLevel(attribute, html, indentLevel + 2), htmlWithTagName);
        return this.insertAtIndentLevel(">", htmlWithAttributes, indentLevel);
    }
    insertClosingTag(closingTag, html, indentLevel) {
        let tagName = HtmlFormatter.getTagName(closingTag);
        html = html.trim();
        closingTag = `</${tagName}>`;
        let elementStartIndex = html.lastIndexOf(`<${tagName}`);
        let elementLines = html
            .slice(elementStartIndex)
            .split(HtmlFormatter.HTML_TAG_REGEX)
            .filter(line => line.trim() !== "");
        let elementEndIndex = elementStartIndex + elementLines[0].length;
        let oneLineElement = elementLines
            .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
            .join("") + closingTag;
        if (this.isShorterThanCharacterLimit(oneLineElement, indentLevel) &&
            oneLineElement.match(HtmlFormatter.HTML_TAG_REGEX).length === 2) {
            return html.slice(0, elementStartIndex) + oneLineElement;
        }
        let endingTagLine = html.slice(html.lastIndexOf("\n")) + closingTag;
        let preceededByOpeningTag = html.length <= elementEndIndex + 1;
        if (preceededByOpeningTag && this.isShorterThanCharacterLimit(endingTagLine, indentLevel)) {
            return html + closingTag;
        }
        return this.insertAtIndentLevel(closingTag, html, indentLevel);
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
            .split("\n")
            .map(paragraph => {
            let lastLine = "";
            let formattedParagraph = paragraph
                .split(HtmlFormatter.WHITESPACE_REGEX)
                .reduce((formattedParagraph, word) => {
                let lineWithWord = `${lastLine} ${word}`.trim();
                if (!this.isShorterThanCharacterLimit(lineWithWord, indentLevel)) {
                    formattedParagraph = this.insertAtIndentLevel(lastLine, formattedParagraph, indentLevel);
                    lineWithWord = word;
                }
                lastLine = lineWithWord;
                return formattedParagraph;
            }, "");
            return lastLine === ""
                ? formattedParagraph + "\n"
                : this.insertAtIndentLevel(lastLine, formattedParagraph, indentLevel);
        })
            .join("")
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
HtmlFormatter.ATTRIBUTE_REGEX = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
HtmlFormatter.VOID_ELEMENT_NAMES = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
exports.HtmlFormatter = HtmlFormatter;

},{}]},{},[1]);

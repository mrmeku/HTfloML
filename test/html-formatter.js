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
            .split(HtmlRegExp.CAPTURE_HTML_TAGS)
            .reduce((html, line) => {
            switch (HtmlFormatter.getLineType(line)) {
                case 0:
                    return this.insertOpeningTag(line, html, indentLevel++);
                case 1:
                    return this.insertClosingTag(line, html, --indentLevel);
                case 2:
                    return this.insertVoidTag(line, html, indentLevel);
                case 3:
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
        let openingTag = unclosedElement.match(HtmlRegExp.OPENING_TAG)[0];
        let oneLineElement = unclosedElement
            .split("\n")
            .map(line => HtmlFormatter.replaceWhiteSpace(line.trim(), " "))
            .join("") + formattedClosingTag;
        if (this.isShorterThanCharacterLimit(oneLineElement, indentLevel) &&
            oneLineElement.match(HtmlRegExp.CAPTURE_HTML_TAGS).length === 2) {
            return trimmedHtml.slice(0, elementStartIndex) + oneLineElement;
        }
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
            .split(HtmlRegExp.PARAGRAPH_DELIMITER)
            .map(paragraph => {
            return paragraph
                .split(HtmlRegExp.WHITESPACE)
                .reduce((formattedParagraph, word) => {
                let lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(formattedParagraph);
                let indentedWord = lastLineTrimmed === "" ? "" : " " + word;
                if (this.isShorterThanCharacterLimit(lastLineTrimmed + indentedWord, indentLevel)) {
                    return formattedParagraph + indentedWord;
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
    insertAtIndentLevel(textToInsert, html, indentLevel) {
        html += "\n";
        for (let indent = 0; indent < this.indentSize * indentLevel; indent++) {
            html += " ";
        }
        html += textToInsert;
        return html;
    }
    static getLineType(line) {
        return (HtmlFormatter.VOID_ELEMENT_NAMES.has(HtmlFormatter.getTagName(line)) ? 2 :
            HtmlRegExp.COMMENT_TAG.test(line) ? 3 :
                HtmlRegExp.CLOSING_TAG.test(line) ? 1 :
                    HtmlRegExp.OPENING_TAG.test(line) ? 0 :
                        line.trim() === "" ? 5 : 4);
    }
    static getLastLineTrimmed(text) {
        return text.slice(Math.max(text.lastIndexOf("\n"), 0)).trim();
    }
    ;
    static getTagName(tag) {
        let tagNameMatch = tag.match(HtmlRegExp.TAG_NAME);
        return tagNameMatch ? tagNameMatch[1] : "";
    }
    static replaceWhiteSpace(text, replaceWhiteSpaceWith) {
        return text.replace(HtmlRegExp.WHITESPACE, replaceWhiteSpaceWith).trim();
    }
    isShorterThanCharacterLimit(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.chracterLimit;
    }
}
HtmlFormatter.VOID_ELEMENT_NAMES = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
exports.HtmlFormatter = HtmlFormatter;
const HtmlRegExp = {
    CAPTURE_HTML_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
    OPENING_TAG: /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    CLOSING_TAG: /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    TAG_NAME: /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/,
    COMMENT_TAG: /<!--[\S\s]*?-->/,
    WHITESPACE: /[\s\n]+/g,
    PARAGRAPH_DELIMITER: /\n[\s\n]*\n/,
    ATTRIBUTE: /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};

},{}]},{},[1]);

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
class HtmlFormatter {
    constructor(indentSize, wrappingColumn) {
        this.indentSize = indentSize;
        this.wrappingColumn = wrappingColumn;
    }
    static getTagName(tag) {
        let tagNameMatch = tag.match(HtmlFormatter.OPENING_TAG_REGEX) ||
            tag.match(HtmlFormatter.CLOSING_TAG_REGEX);
        return tagNameMatch ? tagNameMatch[1] : undefined;
    }
    static getLineType(line) {
        let tagName = HtmlFormatter.getTagName(line);
        return (HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName) ? 3 :
            HtmlFormatter.COMMENT_TAG_REGEX.test(line) ? 2 :
                HtmlFormatter.CLOSING_TAG_REGEX.test(line) ? 1 :
                    HtmlFormatter.OPENING_TAG_REGEX.test(line) ? 0 :
                        line.trim() === "" ? 5 : 4);
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
        openingTag = attributes && attributes.length ?
            `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
        if (this.isShorterThanWrappingColumn(openingTag, indentLevel)) {
            return this.insertAtIndentLevel(openingTag, html, indentLevel);
        }
        html = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
        html = attributes.reduce((html, attribute) => this.insertAtIndentLevel(attribute, html, indentLevel + 2), html);
        return this.insertAtIndentLevel(">", html, indentLevel);
    }
    insertClosingTag(closingTag, html, indentLevel) {
        let tagName = HtmlFormatter.getTagName(closingTag);
        closingTag = `</${tagName}>`;
        let elementStartIndex = html.lastIndexOf(`<${tagName}`);
        let elementLines = html
            .slice(elementStartIndex)
            .split(HtmlFormatter.HTML_TAG_REGEX)
            .filter(line => line !== "");
        let elementEndIndex = elementStartIndex + elementLines[0].length;
        let element = elementLines
            .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
            .join("") + closingTag;
        if (this.isShorterThanWrappingColumn(element, indentLevel) &&
            element.match(HtmlFormatter.HTML_TAG_REGEX).length === 2) {
            return html.slice(0, elementStartIndex) + element;
        }
        html = html.trim();
        let endingTagLine = html.slice(html.lastIndexOf("\n")) + closingTag;
        let preceededByOpeningTag = html.length <= elementEndIndex + 1;
        if (preceededByOpeningTag && this.isShorterThanWrappingColumn(endingTagLine, indentLevel)) {
            return html + closingTag;
        }
        return this.insertAtIndentLevel(closingTag, html, indentLevel);
    }
    insertCommentTag(commentTag, html, indentLevel) {
        let comment = commentTag.trim().slice(4, -3);
        commentTag = `<!-- ${HtmlFormatter.replaceWhiteSpace(comment, " ")} -->`;
        if (this.isShorterThanWrappingColumn(commentTag, indentLevel)) {
            return this.insertAtIndentLevel(commentTag, html, indentLevel);
        }
        else {
            html = this.insertAtIndentLevel("<!--", html, indentLevel);
            html = this.insertText(comment, html, indentLevel + 2);
            html = this.insertAtIndentLevel("-->", html, indentLevel);
        }
        return html;
    }
    insertText(text, html, indentLevel) {
        let formattedText = text.replace(HtmlFormatter.WHITESPACE_REGEX, " ");
        if (!this.isShorterThanWrappingColumn(formattedText, indentLevel)) {
            formattedText = text
                .trim()
                .split("\n")
                .map(section => {
                let currentLine = this.insertAtIndentLevel("", "", indentLevel).slice(1);
                section = section
                    .split(HtmlFormatter.WHITESPACE_REGEX)
                    .reduce((section, currentWord) => {
                    currentWord = currentWord.trim();
                    let line = `${currentLine} ${currentWord}`;
                    if (!this.isShorterThanWrappingColumn(line, indentLevel)) {
                        section = this.insertAtIndentLevel(currentLine.trim(), section, indentLevel);
                        line = this.insertAtIndentLevel(currentWord, "", indentLevel).slice(1);
                    }
                    currentLine = line;
                    return section;
                }, "");
                if (currentLine.trim() !== "") {
                    section = this.insertAtIndentLevel(currentLine.trim(), section, indentLevel);
                }
                else {
                    section = this.insertWhiteSpace(currentLine + "\n\n", section);
                }
                return section;
            }).join("");
        }
        return this.insertAtIndentLevel(formattedText.trim(), html, indentLevel);
    }
    insertWhiteSpace(whitespace, html) {
        for (let newlines = 0; newlines < whitespace.split("\n").length - 2; newlines++) {
            html += "\n";
        }
        return html;
    }
    format(unformattedHtml) {
        let indentLevel = 0;
        return unformattedHtml
            .split(HtmlFormatter.HTML_TAG_REGEX)
            .reduce((html, line) => {
            switch (HtmlFormatter.getLineType(line)) {
                case 3:
                    return this.insertOpeningTag(line, html, indentLevel);
                case 0:
                    return this.insertOpeningTag(line, html, indentLevel++);
                case 1:
                    return this.insertClosingTag(line, html, --indentLevel);
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

},{}]},{},[1]);

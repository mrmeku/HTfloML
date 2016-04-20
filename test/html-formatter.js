(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var LineType;
(function (LineType) {
    LineType[LineType["OPENING_TAG"] = 0] = "OPENING_TAG";
    LineType[LineType["CLOSING_TAG"] = 1] = "CLOSING_TAG";
    LineType[LineType["COMMENT_TAG"] = 2] = "COMMENT_TAG";
    LineType[LineType["TEXT"] = 3] = "TEXT";
    LineType[LineType["WHITESPACE"] = 4] = "WHITESPACE";
})(LineType || (LineType = {}));
;
var HtmlFormatter = (function () {
    function HtmlFormatter(indentSize, wrappingColumn) {
        this.indentSize = indentSize;
        this.wrappingColumn = wrappingColumn;
    }
    HtmlFormatter.getLineType = function (line) {
        if (line.trim() === "") {
            return LineType.WHITESPACE;
        }
        if (line.match(HtmlFormatter.OPENING_TAG_REGEX)) {
            return LineType.OPENING_TAG;
        }
        if (line.match(HtmlFormatter.CLOSING_TAG_REGEX)) {
            return LineType.CLOSING_TAG;
        }
        if (line.match(HtmlFormatter.COMMENT_TAG_REGEX)) {
            return LineType.COMMENT_TAG;
        }
        return LineType.TEXT;
    };
    HtmlFormatter.prototype.insertAtIndentationLevel = function (textToInsert, formattedHtml, indentLevel) {
        formattedHtml += "\n";
        var spacesInserted = 0;
        while (spacesInserted < this.indentSize * indentLevel) {
            formattedHtml += " ";
            ++spacesInserted;
        }
        formattedHtml += textToInsert;
        return formattedHtml;
    };
    HtmlFormatter.prototype.insertOpeningTag = function (openingTag, tagName, formattedHtml, indentLevel) {
        var _this = this;
        var attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HtmlFormatter.ATTRIBUTE_REGEX);
        var formattedOpeningTag = attributes && attributes.length ?
            "<" + tagName + " " + attributes.join(" ") + ">" :
            "<" + tagName + ">";
        if (formattedOpeningTag.length <= this.wrappingColumn) {
            formattedHtml = this.insertAtIndentationLevel(formattedOpeningTag, formattedHtml, indentLevel);
        }
        else {
            formattedHtml = this.insertAtIndentationLevel("<" + tagName, formattedHtml, indentLevel);
            attributes.forEach(function (attribute) {
                formattedHtml = _this.insertAtIndentationLevel(attribute, formattedHtml, indentLevel + 2);
            });
            formattedHtml = this.insertAtIndentationLevel(">", formattedHtml, indentLevel);
        }
        return formattedHtml;
    };
    HtmlFormatter.prototype.insertClosingTag = function (closingTag, formattedHtml, indentLevel, previousLineType) {
        var formattedClosingTag = closingTag.replace(HtmlFormatter.WHITESPACE_REGEX, "");
        // Put closing tag on same line as opening tag if there's enough room.
        if (previousLineType === LineType.OPENING_TAG) {
            var previousLine = formattedHtml.slice(formattedHtml.lastIndexOf("\n"));
            if (previousLine.length + formattedClosingTag.length <= this.wrappingColumn) {
                return formattedHtml + formattedClosingTag;
            }
        }
        return this.insertAtIndentationLevel(formattedClosingTag, formattedHtml, indentLevel);
    };
    HtmlFormatter.prototype.insertText = function (text, formattedHtml, indentLevel) {
        // TODO: Break up text into multiple lines if it goes past wrappingColumn.
        return this.insertAtIndentationLevel(text.trim(), formattedHtml, indentLevel);
    };
    HtmlFormatter.prototype.format = function (html) {
        var _this = this;
        var formattedHtml = "";
        var indentLevel = 0;
        var previousLineType = LineType.TEXT;
        html.split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .filter(function (line) { return line !== ""; })
            .forEach(function (line) {
            var lineType = HtmlFormatter.getLineType(line);
            switch (HtmlFormatter.getLineType(line)) {
                case LineType.OPENING_TAG:
                    var tagName = line.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
                    formattedHtml = _this.insertOpeningTag(line, tagName, formattedHtml, indentLevel);
                    if (!HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName)) {
                        ++indentLevel;
                    }
                    break;
                case LineType.CLOSING_TAG:
                    --indentLevel;
                    formattedHtml = _this.insertClosingTag(line, formattedHtml, indentLevel, previousLineType);
                    break;
                case LineType.COMMENT_TAG:
                case LineType.TEXT:
                    formattedHtml = _this.insertText(line, formattedHtml, indentLevel);
                    break;
                case LineType.WHITESPACE:
                    for (var i = 0; i < line.split("\n").length - 2; i++) {
                        formattedHtml += "\n";
                    }
                    lineType = previousLineType;
            }
            previousLineType = lineType;
        });
        return formattedHtml.trim();
    };
    HtmlFormatter.LineType = LineType;
    // Matches opening or closing tags and captures their contents.
    HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX = new RegExp("(<[\\S\\s]*?>)");
    // Matches opening tags and captures the tag name.
    HtmlFormatter.OPENING_TAG_REGEX = new RegExp("<[\\s\\n]*([a-zA-Z]+)[\\S\\s]*>");
    HtmlFormatter.CLOSING_TAG_REGEX = new RegExp("<[\\s\\n]*/[\\s\\n]*([a-zA-Z]+)[\\S\\s]*?>");
    HtmlFormatter.COMMENT_TAG_REGEX = new RegExp("<!--[\\S\\s]*?-->");
    HtmlFormatter.WHITESPACE_REGEX = new RegExp("[\\s\\n]+");
    HtmlFormatter.ATTRIBUTE_REGEX = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
    HtmlFormatter.VOID_ELEMENT_NAMES = new Set([
        "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
        "link", "menuitem", "meta", "param", "source", "track", "wbr"
    ]);
    return HtmlFormatter;
}());
exports.HtmlFormatter = HtmlFormatter;

},{}]},{},[1]);

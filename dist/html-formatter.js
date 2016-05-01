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
class HtmlFormatter {
    constructor(indentSize, wrappingColumn) {
        this.indentSize = indentSize;
        this.wrappingColumn = wrappingColumn;
    }
    static getLineType(line) {
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
        if (formattedOpeningTag.length <= this.wrappingColumn) {
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
    insertClosingTag(closingTag, tagName, formattedHtml, indentLevel) {
        let formattedClosingTag = closingTag.replace(HtmlFormatter.WHITESPACE_REGEX, "");
        let openingTagIndex = formattedHtml.lastIndexOf(`<${tagName}`);
        let completeTagParts = formattedHtml
            .slice(openingTagIndex)
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .map(line => line.trim())
            .filter((line) => line !== "");
        let completeTag = completeTagParts.join("") + formattedClosingTag;
        if (completeTagParts.length === 1 ||
            indentLevel * this.indentSize + completeTag.length <= this.wrappingColumn) {
            return formattedHtml.slice(0, openingTagIndex) + completeTag;
        }
        return this.insertAtIndentationLevel(formattedClosingTag, formattedHtml, indentLevel);
    }
    format(html) {
        let formattedHtml = "";
        let indentLevel = 0;
        html
            .trim()
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .filter((line) => line !== "")
            .forEach(line => {
            let lineType = HtmlFormatter.getLineType(line);
            let tagName = "";
            switch (lineType) {
                case LineType.OPENING_TAG:
                    tagName = line.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
                    formattedHtml = this.insertOpeningTag(line, tagName, formattedHtml, indentLevel);
                    indentLevel += HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName) ? 0 : 1;
                    break;
                case LineType.CLOSING_TAG:
                    if (!HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName)) {
                        --indentLevel;
                        tagName = line.match(HtmlFormatter.CLOSING_TAG_REGEX)[1];
                        formattedHtml = this.insertClosingTag(line, tagName, formattedHtml, indentLevel);
                    }
                    break;
                case LineType.COMMENT_TAG:
                case LineType.TEXT:
                    formattedHtml = this.insertAtIndentationLevel(line.trim(), formattedHtml, indentLevel);
                    break;
                case LineType.WHITESPACE:
                    for (let i = 0; i < line.split("\n").length - 2; i++) {
                        formattedHtml += "\n";
                    }
                    break;
            }
        });
        return formattedHtml.trim() + "\n";
    }
}
HtmlFormatter.LineType = LineType;
// Matches opening or closing tags and captures their contents.
HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/;
// Matches opening tags and captures the tag name.
HtmlFormatter.OPENING_TAG_REGEX = /<[\s\n]*([a-zA-Z0-9-]+)[\S\s]*>/;
// Matches closing tags and captures the tag name.
HtmlFormatter.CLOSING_TAG_REGEX = /<[\s\n]*\/[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
HtmlFormatter.COMMENT_TAG_REGEX = /<!--[\S\s]*?-->/;
HtmlFormatter.WHITESPACE_REGEX = /[\s\n]+/;
// Matches attributes wrapped in double quotes. Ignores espaped quotes inside attributes.
HtmlFormatter.ATTRIBUTE_REGEX = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
// Set of "void" tag names, i.e. tags that do not need to be closed.
HtmlFormatter.VOID_ELEMENT_NAMES = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
exports.HtmlFormatter = HtmlFormatter;
//# sourceMappingURL=html-formatter.js.map
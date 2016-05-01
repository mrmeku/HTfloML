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
//# sourceMappingURL=html-formatter.js.map
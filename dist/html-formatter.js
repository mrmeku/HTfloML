"use strict";
class HTfloML {
    constructor(indentSize, characterLimit) {
        this.indentSize = indentSize;
        this.chracterLimit = characterLimit;
    }
    formatHtml(unformattedHtml) {
        let indentLevel = 0;
        return unformattedHtml
            .split(HtmlRegExp.CAPTURE_TAGS)
            .reduce((html, tag) => {
            switch (HTfloML.getHtmlType(tag)) {
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
        let tagName = HTfloML.getTagName(openingTag);
        let attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HtmlRegExp.ATTRIBUTE);
        let oneLineOpeningTag = attributes ? `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
        if (this.isShorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
            return this.insertOnIndentedNewLine(oneLineOpeningTag, html, indentLevel);
        }
        let htmlWithTagName = this.insertOnIndentedNewLine(`<${tagName}`, html, indentLevel);
        let htmlWithAttributes = attributes.reduce((html, attribute) => this.insertOnIndentedNewLine(attribute, html, indentLevel + 2), htmlWithTagName);
        return this.insertOnIndentedNewLine(">", htmlWithAttributes, indentLevel);
    }
    insertClosingTag(closingTag, html, indentLevel) {
        let tagName = HTfloML.getTagName(closingTag);
        let formattedClosingTag = `</${tagName}>`;
        let trimmedHtml = html.trim();
        let elementStartIndex = trimmedHtml.lastIndexOf(`<${tagName}`);
        let unclosedElement = trimmedHtml.slice(elementStartIndex);
        let oneLineElement = unclosedElement
            .split("\n")
            .map(HTfloML.normalizeSpace)
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
            let lastLineTrimmed = HTfloML.getLastLineTrimmed(html);
            if (this.isShorterThanCharacterLimit(lastLineTrimmed + formattedClosingTag, indentLevel)) {
                return trimmedHtml + formattedClosingTag;
            }
        }
        return this.insertOnIndentedNewLine(formattedClosingTag, trimmedHtml, indentLevel);
    }
    insertVoidTag(voidTag, html, indentLevel) {
        return HtmlRegExp.CLOSING_TAG.test(voidTag)
            ? html : this.insertOpeningTag(voidTag, html, indentLevel);
    }
    insertCommentTag(commentTag, html, indentLevel) {
        let comment = commentTag.trim().slice(4, -3);
        let oneLineCommentTag = `<!-- ${HTfloML.normalizeSpace(comment)} -->`;
        if (this.isShorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
            return this.insertOnIndentedNewLine(oneLineCommentTag, html, indentLevel);
        }
        let htmlWithCommentOpening = this.insertOnIndentedNewLine("<!--", html, indentLevel);
        let htmlWithComment = this.insertContent(comment, htmlWithCommentOpening, indentLevel + 2);
        return this.insertOnIndentedNewLine("-->", htmlWithComment, indentLevel);
    }
    insertContent(content, html, indentLevel) {
        let oneLineText = HTfloML.normalizeSpace(content);
        if (this.isShorterThanCharacterLimit(oneLineText, indentLevel)) {
            return this.insertOnIndentedNewLine(oneLineText, html, indentLevel);
        }
        let formattedContent = content
            .split(HtmlRegExp.PARAGRAPH_DELIMITER)
            .map(paragraph => {
            return paragraph
                .split(HtmlRegExp.WHITESPACE)
                .reduce((indentedParagraph, word) => {
                let lastLineTrimmed = HTfloML.getLastLineTrimmed(indentedParagraph);
                let indentedWord = (lastLineTrimmed === "" ? "" : " ") + word;
                if (this.isShorterThanCharacterLimit(lastLineTrimmed + indentedWord, indentLevel)) {
                    return indentedParagraph + indentedWord;
                }
                return this.insertOnIndentedNewLine(word, indentedParagraph, indentLevel);
            }, this.insertOnIndentedNewLine("", "", indentLevel));
        })
            .join("\n")
            .trim();
        return this.insertOnIndentedNewLine(formattedContent, html, indentLevel);
    }
    static getHtmlType(html) {
        if (html.match(HtmlRegExp.CAPTURE_TAGS)) {
            let tagName = HTfloML.getTagName(html);
            return VoidTagNameSet.has(tagName) ? 2 :
                HtmlRegExp.COMMENT_TAG.test(html) ? 3 :
                    HtmlRegExp.CLOSING_TAG.test(html) ? 1 : 0;
        }
        return html.trim() === "" ? 5 : 4;
    }
    static getTagName(tag) {
        let match = tag.match(HtmlRegExp.TAG_NAME);
        return match ? match[1] : "";
    }
    static normalizeSpace(text) {
        return text.replace(HtmlRegExp.WHITESPACE, " ").trim();
    }
    static getLastLineTrimmed(text) {
        return text.slice(Math.max(text.lastIndexOf("\n"), 0)).trim();
    }
    ;
    insertOnIndentedNewLine(textToInsert, html, indentLevel) {
        let indent = Array(this.indentSize * indentLevel + 1).join(" ");
        return `${html}\n${indent}${textToInsert}`;
    }
    isShorterThanCharacterLimit(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.chracterLimit;
    }
}
exports.HTfloML = HTfloML;
const VoidTagNameSet = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
const HtmlRegExp = {
    CAPTURE_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
    OPENING_TAG: /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    CLOSING_TAG: /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    TAG_NAME: /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/,
    COMMENT_TAG: /<![\S\s]*?>/,
    WHITESPACE: /[\s\n]+/g,
    PARAGRAPH_DELIMITER: /\n[\s\n]*\n/,
    ATTRIBUTE: /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};

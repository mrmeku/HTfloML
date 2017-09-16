"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HtmlFormatter {
    /**
     * @param indentSize The number of spaces to insert when indenting a line one level.
     * @param characterLimit The maximum number of characters permitted to be on a single line.
     */
    constructor(indentSize, characterLimit) {
        this.indentSize = indentSize;
        this.characterLimit = characterLimit;
    }
    /**
     * Formats HTML to meet the following specification:
     *   - Leaf elements
     *       Placed on one indented line if shorter than the character limit.
     *   - Opening tags
     *       Placed on one indented line if shorter than the character limit.
     *       Otherwise, each attribute is placed on an lines further indented 2 levels.
     *   - Closing tags
     *       Immediately after the opening tag if element is empty or shorter than the character limit.
     *       Otherwise, on one indented line.
     *   - Comment tags
     *       Placed on one indented line if shorter than the character limit.
     *       Otherwise, paragraphs (delimited by empty new lines) wrap at the character limit.
     *   - Text nodes
     *       Placed on one indented line if shorter than the character limit.
     *       Otherwise, paragraphs (delimited by two or more consecutive new lines) wrap at the character limit.
     */
    formatHtml(unformattedHtml) {
        let indentLevel = 0;
        return unformattedHtml
            .split(HTML_REG_EXP.CAPTURE_TAGS)
            .reduce((html, tag) => {
            switch (HtmlFormatter.getHtmlType(tag)) {
                case HtmlType.DOCTYPE: return this.insertDoctype(tag, html, indentLevel);
                case HtmlType.OPENING_TAG: return this.insertOpeningTag(tag, html, indentLevel++);
                case HtmlType.CLOSING_TAG: return this.insertClosingTag(tag, html, --indentLevel);
                case HtmlType.VOID_TAG: return this.insertVoidTag(tag, html, indentLevel);
                case HtmlType.COMMENT_TAG: return this.insertCommentTag(tag, html, indentLevel);
                case HtmlType.TEXT_NODE: return this.insertTextNode(tag, html, indentLevel);
                case HtmlType.WHITESPACE: return this.insertWhitespace(tag, html);
                default: return html;
            }
        }, "")
            .trim() + "\n";
    }
    insertDoctype(doctype, html, indentLevel) {
        const doctypeContents = doctype.slice(doctype.indexOf('!DOCTYPE') + '!DOCTYPE'.length, doctype.lastIndexOf('>'));
        return `<!DOCTYPE ${HtmlFormatter.normalizeWhitespace(doctypeContents)}>`;
    }
    /**
     * Inserted on one indented line if shorter than the character limit.
     * Otherwise, each attribute is inserted on a new line further indented 2 levels.
     */
    insertOpeningTag(openingTag, html, indentLevel) {
        const tagName = HtmlFormatter.getTagName(openingTag);
        const attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HTML_REG_EXP.ATTRIBUTE);
        const oneLineOpeningTag = attributes ? `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
        if (this.shorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
            return this.insertIndentedLine(oneLineOpeningTag, html, indentLevel);
        }
        const htmlWithTagName = this.insertIndentedLine(`<${tagName}`, html, indentLevel);
        const htmlWithAttributes = attributes.reduce((html, attribute) => this.insertIndentedLine(attribute, html, indentLevel + 2), htmlWithTagName);
        return this.insertIndentedLine(">", htmlWithAttributes, indentLevel);
    }
    /**
     * Insert leaf elements on one indented line if shorter than the character limit.
     * Insert closing tags of elements with not content immediately after the opening tag if shorter
     *   than the character limit.
     * Otherwise, insert closing tags on new indented lines.
     */
    insertClosingTag(closingTag, html, indentLevel) {
        const tagName = HtmlFormatter.getTagName(closingTag);
        const formattedClosingTag = `</${tagName}>`;
        const trimmedHtml = html.trim();
        const elementStartIndex = trimmedHtml.lastIndexOf(`<${tagName}`);
        const unclosedElement = trimmedHtml.slice(elementStartIndex);
        const oneLineElement = unclosedElement
            .split("\n")
            .map(HtmlFormatter.normalizeWhitespace)
            .join("") + formattedClosingTag;
        const isLeafElement = oneLineElement.match(HTML_REG_EXP.CAPTURE_TAGS).length === 2;
        if (isLeafElement) {
            if (this.shorterThanCharacterLimit(oneLineElement, indentLevel)) {
                return trimmedHtml.slice(0, elementStartIndex) + oneLineElement;
            }
        }
        const openingTag = unclosedElement.match(HTML_REG_EXP.OPENING_TAG)[0];
        const elementIsEmpty = trimmedHtml.length === elementStartIndex + openingTag.length;
        if (elementIsEmpty) {
            const lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(html) + formattedClosingTag;
            if (this.shorterThanCharacterLimit(lastLineTrimmed, indentLevel)) {
                return trimmedHtml + formattedClosingTag;
            }
        }
        return this.insertIndentedLine(formattedClosingTag, trimmedHtml, indentLevel);
    }
    insertVoidTag(voidTag, html, indentLevel) {
        return HTML_REG_EXP.CLOSING_TAG.test(voidTag) ? html :
            this.insertOpeningTag(voidTag, html, indentLevel);
    }
    /**
     * Inserted on one indented line if shorter than the character limit.
     * Otherwise, insert paragraphs (delimited by empty new lines) which wrap at the character limit.
     */
    insertCommentTag(commentTag, html, indentLevel) {
        const comment = commentTag.trim().slice(4, -3);
        const oneLineCommentTag = `<!-- ${HtmlFormatter.normalizeWhitespace(comment)} -->`;
        if (this.shorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
            return this.insertIndentedLine(oneLineCommentTag, html, indentLevel);
        }
        const htmlWithCommentOpening = this.insertIndentedLine("<!--", html, indentLevel);
        const htmlWithComment = this.insertTextNode(comment, htmlWithCommentOpening, indentLevel + 2);
        return this.insertIndentedLine("-->", htmlWithComment, indentLevel);
    }
    /**
     * Inserted on one indented line if shorter than the character limit.
     * Otherwise, insert paragraphs (delimited by empty new lines) which wrap at the character limit.
     */
    insertTextNode(content, html, indentLevel) {
        const oneLineText = HtmlFormatter.normalizeWhitespace(content);
        if (this.shorterThanCharacterLimit(oneLineText, indentLevel)) {
            return this.insertIndentedLine(oneLineText, html, indentLevel);
        }
        const formattedContent = content
            .split(HTML_REG_EXP.PARAGRAPH_DELIMITER)
            .map(paragraph => {
            return paragraph
                .split(HTML_REG_EXP.WHITESPACE)
                .reduce((indentedParagraph, word) => {
                const lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(indentedParagraph);
                const indentedWord = (lastLineTrimmed === "" ? "" : " ") + word;
                if (this.shorterThanCharacterLimit(lastLineTrimmed + indentedWord, indentLevel)) {
                    return indentedParagraph + indentedWord;
                }
                return this.insertIndentedLine(word, indentedParagraph, indentLevel);
            }, this.insertIndentedLine("", "", indentLevel));
        })
            .join("\n")
            .trim();
        return this.insertIndentedLine(formattedContent, html, indentLevel);
    }
    insertWhitespace(whitespace, html) {
        return html + (whitespace.match(/\n/g) || []).slice(1).join("");
    }
    insertIndentedLine(textToInsert, html, indentLevel) {
        const indentSize = Math.max(0, this.indentSize * indentLevel);
        return `${html}\n${" ".repeat(indentSize)}${textToInsert}`;
    }
    shorterThanCharacterLimit(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.characterLimit;
    }
    /**
     * Returns the last line of a string of text with the leading and trailing whitespace removed.
     */
    static getLastLineTrimmed(text) {
        return text.slice(Math.max(text.lastIndexOf("\n"), 0)).trim();
    }
    ;
    static getHtmlType(html) {
        if (html.match(HTML_REG_EXP.CAPTURE_TAGS)) {
            const tagName = HtmlFormatter.getTagName(html);
            return VOID_TAG_NAME_SET.has(tagName) ? HtmlType.VOID_TAG :
                HTML_REG_EXP.DOCTYPE.test(html) ? HtmlType.DOCTYPE :
                    HTML_REG_EXP.COMMENT_TAG.test(html) ? HtmlType.COMMENT_TAG :
                        HTML_REG_EXP.CLOSING_TAG.test(html) ? HtmlType.CLOSING_TAG :
                            HtmlType.OPENING_TAG;
        }
        return html.trim() === "" ? HtmlType.WHITESPACE :
            HtmlType.TEXT_NODE;
    }
    /** Returns the tag names of opening, closing and void tags, the empty string otherwise. */
    static getTagName(tag) {
        const match = tag.match(HTML_REG_EXP.TAG_NAME);
        return match ? match[1] : "";
    }
    /**
     * Strips leading and trailing white space and replaces sequences of white space characters with a
     * single space.
     */
    static normalizeWhitespace(text) {
        return text.replace(HTML_REG_EXP.WHITESPACE, " ").trim();
    }
}
exports.HtmlFormatter = HtmlFormatter;
var HtmlType;
(function (HtmlType) {
    HtmlType[HtmlType["OPENING_TAG"] = 0] = "OPENING_TAG";
    HtmlType[HtmlType["CLOSING_TAG"] = 1] = "CLOSING_TAG";
    HtmlType[HtmlType["VOID_TAG"] = 2] = "VOID_TAG";
    HtmlType[HtmlType["COMMENT_TAG"] = 3] = "COMMENT_TAG";
    HtmlType[HtmlType["TEXT_NODE"] = 4] = "TEXT_NODE";
    HtmlType[HtmlType["WHITESPACE"] = 5] = "WHITESPACE";
    HtmlType[HtmlType["DOCTYPE"] = 6] = "DOCTYPE";
})(HtmlType || (HtmlType = {}));
/** Set of "void" tag names, i.e. tags that do not need to be closed. */
const VOID_TAG_NAME_SET = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
/**
 * Regular Expressions use for paring HTML. For more details see:
 * http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
 */
const HTML_REG_EXP = {
    DOCTYPE: /<!DOCTYPE[\S\s]*?>/,
    // Captures opening closing, comment and void tags.
    CAPTURE_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
    // Matches opening tags.
    OPENING_TAG: /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    // Matches closing tags.
    CLOSING_TAG: /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    // Matches opening or closing tags.
    TAG_NAME: /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/,
    // Matches comment tags.
    COMMENT_TAG: /<!--[\S\s]*?-->/,
    // Matches whitespace (including new lines).
    WHITESPACE: /[\s\n]+/g,
    // Matches empty lines.
    PARAGRAPH_DELIMITER: /\n[\s\n]*\n/,
    // Matches attributes wrapped in double quotes. Ignores escaped quotes inside attributes.
    ATTRIBUTE: /[\[\]\(\)\#@a-zA-Z\d\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};

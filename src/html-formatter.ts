export class HTfloML {
  indentSize: number;
  chracterLimit: number;

  constructor(indentSize: number, characterLimit: number) {
    this.indentSize = indentSize;
    this.chracterLimit = characterLimit;
  }

  /**
   * Leaf elements
   *   Placed on one indented line if shorter than the character limit.
   * Opening tags
   *   Placed on one indented line if shorter than the character limit.
   *   Otherwise, each attribute is placed on an lines further indented 2 levels.
   * Closing tags
   *   Immediately after the opening tag if element is empty or shorter than the character limit.
   *   Otherwise, on one indented line.
   * Comment tags
   *   Placed on one indented line if shorter than the character limit.
   *   Otherwise, paragraphs (delimited by empty new lines) wrap at the character limit.
   * Content
   *   Placed on one indented line if shorter than the character limit.
   *   Otherwise, paragraphs (delimited by empty new lines) wrap at the character limit.
   */
  public formatHtml(unformattedHtml: string) {
    let indentLevel = 0;
    return unformattedHtml
      .split(HtmlRegExp.CAPTURE_TAGS)
      .reduce((html, tag) => {
        switch (HTfloML.getHtmlType(tag)) {
          case HtmlType.WHITESPACE: return this.insertWhiteSpace(tag, html);
          case HtmlType.OPENING_TAG:    return this.insertOpeningTag(tag, html, indentLevel++);
          case HtmlType.CLOSING_TAG:    return this.insertClosingTag(tag, html, --indentLevel);
          case HtmlType.VOID_TAG:       return this.insertVoidTag(tag, html, indentLevel);
          case HtmlType.COMMENT_TAG:    return this.insertCommentTag(tag, html, indentLevel);
          case HtmlType.CONTENT:    return this.insertContent(tag, html, indentLevel);
          default:                     return html;
        }
      }, "")
      .trim() + "\n";
  }

  insertWhiteSpace(whitespace: string, html: string): string {
    return html + (whitespace.match(/\n/g) || [] ).slice(1).join("");
  }

  /**
   * Inserted on one indented line if shorter than the character limit.
   * Otherwise, each attribute is inserted on a new line further indented 2 levels.
   */
  insertOpeningTag(openingTag: string, html: string, indentLevel: number): string {
    let tagName = HTfloML.getTagName(openingTag);
    let attributes = openingTag
      .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
      .match(HtmlRegExp.ATTRIBUTE);

    let oneLineOpeningTag = attributes ? `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
    if (this.isShorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
      return this.insertOnIndentedNewLine(oneLineOpeningTag, html, indentLevel);
    }

    let htmlWithTagName = this.insertOnIndentedNewLine(`<${tagName}`, html, indentLevel);
    let htmlWithAttributes = attributes.reduce((html, attribute) =>
      this.insertOnIndentedNewLine(attribute, html, indentLevel + 2), htmlWithTagName);
    return this.insertOnIndentedNewLine(">", htmlWithAttributes, indentLevel);
  }

  /**
   * Insert leaf elements on one indented line if shorter than the character limit.
   * Otherwise insert after the opening tag if element is empty and shorter than the character limit.
   * Otherwise, insert on one indented line.
   */
  insertClosingTag(closingTag: string, html: string, indentLevel: number): string {
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

  insertVoidTag(voidTag: string, html: string, indentLevel: number) {
    return HtmlRegExp.CLOSING_TAG.test(voidTag)
      ? html : this.insertOpeningTag(voidTag, html, indentLevel);
  }

  /**
   * Inserted on one indented line if shorter than the character limit.
   * Otherwise, insert paragraphs (delimited by empty new lines) which wrap at the character limit.
   */
  insertCommentTag(commentTag: string, html: string, indentLevel: number): string {
    let comment = commentTag.trim().slice(4, -3);
    let oneLineCommentTag = `<!-- ${HTfloML.normalizeSpace(comment)} -->`;
    if (this.isShorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
      return this.insertOnIndentedNewLine(oneLineCommentTag, html, indentLevel);
    }

    let htmlWithCommentOpening = this.insertOnIndentedNewLine("<!--", html, indentLevel);
    let htmlWithComment = this.insertContent(comment, htmlWithCommentOpening, indentLevel + 2);
    return this.insertOnIndentedNewLine("-->", htmlWithComment, indentLevel);
  }

  /**
   * Inserted on one indented line if shorter than the character limit.
   * Otherwise, insert paragraphs (delimited by empty new lines) which wrap at the character limit.
   */
  insertContent(content: string, html: string, indentLevel: number): string {
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

  /** Returns the HtmlTagType of a portion of html broken on tags */
  static getHtmlType(html: string): HtmlType {
    if (html.match(HtmlRegExp.CAPTURE_TAGS)) {
      let tagName = HTfloML.getTagName(html);
      return  VoidTagNameSet.has(tagName) ? HtmlType.VOID_TAG :
        HtmlRegExp.COMMENT_TAG.test(html) ? HtmlType.COMMENT_TAG :
        HtmlRegExp.CLOSING_TAG.test(html) ? HtmlType.CLOSING_TAG : HtmlType.OPENING_TAG;
    }

    return html.trim() === "" ? HtmlType.WHITESPACE : HtmlType.CONTENT;
  }

  /** Gets the name of an opening, closing or void tag */
  private static getTagName(tag: string): string {
    let match = tag.match(HtmlRegExp.TAG_NAME);
    return match ? match[1] : "";
  }

  /** Stips leading, trailing, and repeating white space. */
  private static normalizeSpace(text: string) {
    return text.replace(HtmlRegExp.WHITESPACE, " ").trim();
  }

  /** Returns the last line of a string of text with the leading and trailing whitespace removed. */
  private static getLastLineTrimmed(text: string): string {
    return text.slice(Math.max(text.lastIndexOf("\n"), 0)).trim();
  };

  /** Inserts text into html on a new line indented to a specified level. */
  private insertOnIndentedNewLine(textToInsert: string, html: string, indentLevel: number): string {
    let indent =  Array(this.indentSize * indentLevel + 1).join(" ");
    return `${html}\n${indent}${textToInsert}`;
  }

  /** Whether the text indented to the indent level is shorter than the character limit */
  private isShorterThanCharacterLimit(text: string, indentLevel: number): boolean {
    return indentLevel * this.indentSize + text.length <= this.chracterLimit;
  }
}

export const enum HtmlType {
  OPENING_TAG,
  CLOSING_TAG,
  VOID_TAG,
  COMMENT_TAG,
  CONTENT,
  WHITESPACE
}

/** Set of "void" tag names, i.e. tags that do not need to be closed. */
const VoidTagNameSet: Set<string> = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
  "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);

/**
 * Regular Expressions use for paring HTML. For more details see:
 * http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
 */
const HtmlRegExp = {
  // Captures opening closing, comment and void tags.
  CAPTURE_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
  // Matches opening tags.
  OPENING_TAG: /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
  // Matches closing tags.
  CLOSING_TAG: /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
  // Matches opening or closing tags.
  TAG_NAME: /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/,
  // Matches comment tags.
  COMMENT_TAG: /<![\S\s]*?>/,
  // Matches whitespace (including new lines).
  WHITESPACE: /[\s\n]+/g,
  // Matches empty lines.
  PARAGRAPH_DELIMITER: /\n[\s\n]*\n/,
  // Matches attributes wrapped in double quotes. Ignores espaped quotes inside attributes.
  ATTRIBUTE: /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};
export class HtmlFormatter {
  indentSize: number;
  chracterLimit: number;

  constructor(indentSize: number, characterLimit: number) {
    this.indentSize = indentSize;
    this.chracterLimit = characterLimit;
  }

  /**
   * Formats HTML according to the following rules:
   * Opening tag placement
   *   On one line if shorter than the character limit. Otherwise, place each attribute such that
   *   each is on one line, further indented by two levels.
   * Closing tag placement
   *   Immediately after the opening tag if an element is empty and it would not go passed the
   *   character limit. Otherwise, on a new line.
   * Comment tag placement
   *   On one line if shorter than the character limit Otherwise place the comment such that
   *   paragraphs (delimited by empty lines) wrap at the character limit.
   * Text node placement
   *   On one line if shorter than the character limit. Otherwise place the text such that
   *   paragraphs (delimited by empty lines) wrap at the character limit.
   * Leaf elements placement
   *   On one line if shorter than the character limit.
   */
  public format(unformattedHtml: string) {
    let indentLevel = 0;
    return unformattedHtml
      .split(HtmlRegExp.CAPTURE_TAGS)
      .reduce((html, tag) => {
        switch (HtmlFormatter.getHtmlTagType(tag)) {
          case HtmlTagType.WHITESPACE: return this.insertWhiteSpace(tag, html);
          case HtmlTagType.OPENING:    return this.insertOpeningTag(tag, html, indentLevel++);
          case HtmlTagType.CLOSING:    return this.insertClosingTag(tag, html, --indentLevel);
          case HtmlTagType.VOID:       return this.insertVoidTag(tag, html, indentLevel);
          case HtmlTagType.COMMENT:    return this.insertCommentTag(tag, html, indentLevel);
          case HtmlTagType.CONTENT:    return this.insertContent(tag, html, indentLevel);
          default:                     return html;
        }
      }, "")
      .trim() + "\n";
  }

 /**
  * Inserts whitespace as newlines (trailing whitespace is trimmed from each line).
  */
  insertWhiteSpace(whitespace: string, html: string): string {
    return html + (whitespace.match(/\n/g) || [] ).slice(1).join("");
  }

  /**
   * Inserts opening tag as one line into html if shorter than the character limit. Otherwise,
   * the opening tag is inserted such that each attribute such that each is on one line,
   * further indented by two levels.
   */
  insertOpeningTag(openingTag: string, html: string, indentLevel: number): string {
    let tagName = HtmlFormatter.getTagName(openingTag);
    let attributes = openingTag
      .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
      .match(HtmlRegExp.ATTRIBUTE);

    let oneLineOpeningTag = attributes ? `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
    if (this.isShorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
      return this.insertAtIndentLevel(oneLineOpeningTag, html, indentLevel);
    }

    let htmlWithTagName = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
    let htmlWithAttributes = attributes.reduce((html, attribute) =>
      this.insertAtIndentLevel(attribute, html, indentLevel + 2), htmlWithTagName);
    return this.insertAtIndentLevel(">", htmlWithAttributes, indentLevel);
  }

  /**
   * If an element is a leaf, than it is formatted to fit on one line if it would not go passed the
   * character limit. Otherwise, if an element is empty, a closing tag is inserted immediately
   * after an opening tag if it would not go passed the character limit. Otherwise, the closing tag
   * is inserted on a new line.
   */
  insertClosingTag(closingTag: string, html: string, indentLevel: number): string {
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

  /**
   * A void tag is inserted as an opening tag.
   */
  insertVoidTag(voidTag: string, html: string, indentLevel: number) {
    return HtmlRegExp.CLOSING_TAG.test(voidTag)
      ? html
      : this.insertOpeningTag(voidTag, html, indentLevel);
  }

  /**
   * A comment tag is insert on one line if it would not go passed the character limit. Otherwise,
   * it is inserted such that paragraphs (delimited by empty lines) wrap at the character limit and
   * are seperated by a single new line.
   */
  insertCommentTag(commentTag: string, html: string, indentLevel: number): string {
    let comment = commentTag.trim().slice(4, -3);
    let oneLineCommentTag = `<!-- ${HtmlFormatter.normalizeSpace(comment)} -->`;
    if (this.isShorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
      return this.insertAtIndentLevel(oneLineCommentTag, html, indentLevel);
    }

    let htmlWithCommentOpening = this.insertAtIndentLevel("<!--", html, indentLevel);
    let htmlWithComment = this.insertContent(comment, htmlWithCommentOpening, indentLevel + 2);
    return this.insertAtIndentLevel("-->", htmlWithComment, indentLevel);
  }

  /**
   * Content is inserted on one line if it would not go passed the character limit. Otherwise, it is
   * inserted such that paragraphs (delimited by empty lines) wrap at the character limit and
   * are seperated by a single new line.
   */
  insertContent(content: string, html: string, indentLevel: number): string {
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

  /** Returns the HtmlTagType of a portion of html broken on tags */
  static getHtmlTagType(text: string): HtmlTagType {
    return VoidTagNames.has(HtmlFormatter.getTagName(text)) ? HtmlTagType.VOID :
      HtmlRegExp.COMMENT_TAG.test(text) ? HtmlTagType.COMMENT :
        HtmlRegExp.CLOSING_TAG.test(text) ? HtmlTagType.CLOSING :
          HtmlRegExp.OPENING_TAG.test(text) ? HtmlTagType.OPENING :
            text.trim() === "" ? HtmlTagType.WHITESPACE :
              HtmlTagType.CONTENT;
  }

  /** Gets the name of an opening, closing or void tag */
  private static getTagName(tag: string): string {
    let tagNameMatch = tag.match(HtmlRegExp.TAG_NAME);
    return tagNameMatch ? tagNameMatch[1] : "";
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
  private insertAtIndentLevel(textToInsert: string, html: string, indentLevel: number): string {
    let indent =  Array(this.indentSize * indentLevel + 1).join(" ");
    return `${html}\n${indent}${textToInsert}`;
  }

  /** Returns whether the text would be shorter than the character limit when indented */
  private isShorterThanCharacterLimit(text: string, indentLevel: number): boolean {
    return indentLevel * this.indentSize + text.length <= this.chracterLimit;
  }
}

/** Classificaitoon of a portion of an html string that has been broken on tags. */
export const enum HtmlTagType {
  OPENING,
  CLOSING,
  VOID,
  COMMENT,
  CONTENT,
  WHITESPACE
}

/** Set of "void" tag names, i.e. tags that do not need to be closed. */
const VoidTagNames: Set<string> = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
  "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);

/**
 * Regular Expressions use for paring HTML. For more details see:
 * http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
 */
const HtmlRegExp = {
  // Matches opening or closing tags and captures their contents.
  CAPTURE_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
  // Matches opening tags .
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
  // Matches attributes wrapped in double quotes. Ignores espaped quotes inside attributes.
  ATTRIBUTE: /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};
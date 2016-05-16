export const enum LineType {
  OPENING_TAG,
  CLOSING_TAG,
  COMMENT_TAG,
  VOID_TAG,
  TEXT,
  WHITESPACE
}

export class HtmlFormatter {
  // Matches opening or closing tags and captures their contents.
  static HTML_TAG_REGEX: RegExp = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g;
  // Matches opening tags .
  static OPENING_TAG_REGEX: RegExp = /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/;
  // Matches closing tags.
  static CLOSING_TAG_REGEX: RegExp = /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/;
  // Matches opening or closing tags.
  static TAG_NAME_REGEX: RegExp = /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
  // Matches comment tags.
  static COMMENT_TAG_REGEX: RegExp = /<!--[\S\s]*?-->/;
  // Matches whitespace (including new lines).
  static WHITESPACE_REGEX: RegExp = /[\s\n]+/g;
  static PARAGRAPH_DELIMITER_REGEX = /\n[\s\n]*/;
  // Matches attributes wrapped in double quotes. Ignores espaped quotes inside attributes.
  static ATTRIBUTE_REGEX: RegExp = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
  // Set of "void" tag names, i.e. tags that do not need to be closed.
  static VOID_ELEMENT_NAMES: Set<string> = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
  ]);

  static getTagName(tag: string): string {
    let tagNameMatch = tag.match(HtmlFormatter.TAG_NAME_REGEX);
    return tagNameMatch ? tagNameMatch[1] : "";
  }

  static getLineType(line: string): LineType {
    return (
      HtmlFormatter.VOID_ELEMENT_NAMES.has(HtmlFormatter.getTagName(line)) ? LineType.VOID_TAG :
        HtmlFormatter.COMMENT_TAG_REGEX.test(line) ? LineType.COMMENT_TAG :
          HtmlFormatter.CLOSING_TAG_REGEX.test(line) ? LineType.CLOSING_TAG :
            HtmlFormatter.OPENING_TAG_REGEX.test(line) ? LineType.OPENING_TAG :
              line.trim() === "" ? LineType.WHITESPACE : LineType.TEXT);
  }

  static replaceWhiteSpace(text: string, replaceWhiteSpaceWith: string) {
    return text.replace(HtmlFormatter.WHITESPACE_REGEX, replaceWhiteSpaceWith).trim();
  }

  indentSize: number;
  chracterLimit: number;

  constructor(indentSize: number, characterLimit: number) {
    this.indentSize = indentSize;
    this.chracterLimit = characterLimit;
  }

  isShorterThanCharacterLimit(text: string, indentLevel: number): boolean {
    return indentLevel * this.indentSize + text.length <= this.chracterLimit;
  }

  insertAtIndentLevel(textToInsert: string, html: string, indentLevel: number): string {
    html += "\n";
    for (let indent = 0; indent < this.indentSize * indentLevel; indent++) {
      html += " ";
    }
    html += textToInsert;
    return html;
  }

  insertOpeningTag(openingTag: string, html: string, indentLevel: number): string {
    let tagName = HtmlFormatter.getTagName(openingTag);
    let attributes: Array<string> = openingTag
      .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
      .match(HtmlFormatter.ATTRIBUTE_REGEX) || [];

    let oneLineOpeningTag = attributes.length > 0 ?
      `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
    if (this.isShorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
      return this.insertAtIndentLevel(oneLineOpeningTag, html, indentLevel);
    }

    let htmlWithTagName = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
    let htmlWithAttributes = attributes.reduce((html, attribute) =>
      this.insertAtIndentLevel(attribute, html, indentLevel + 2), htmlWithTagName);
    return this.insertAtIndentLevel(">", htmlWithAttributes, indentLevel);
  }

  insertClosingTag(closingTag: string, html: string, indentLevel: number): string {
    let tagName = HtmlFormatter.getTagName(closingTag);
    let trimmedHtml = html.trim();
    closingTag = `</${tagName}>`

    let openingTagIndex = trimmedHtml.lastIndexOf(`<${tagName}`);

    let elementLines = trimmedHtml
      .slice(openingTagIndex)
      .split(HtmlFormatter.HTML_TAG_REGEX)
      .filter(line => line.trim() !== "");

    let oneLineElement = elementLines
      .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
      .join("") + closingTag;

    if (this.isShorterThanCharacterLimit(oneLineElement, indentLevel) &&
      oneLineElement.match(HtmlFormatter.HTML_TAG_REGEX).length === 2) {
      return trimmedHtml.slice(0, openingTagIndex) + oneLineElement;
    }

    let endingTagLine = trimmedHtml.slice(trimmedHtml.lastIndexOf("\n")) + closingTag;
    let openingTag = elementLines[0];
    let preceededByOpeningTag = trimmedHtml.length <= openingTagIndex + openingTag.length + 1;
    if (preceededByOpeningTag && this.isShorterThanCharacterLimit(endingTagLine, indentLevel)) {
      return trimmedHtml + closingTag;
    }

    return this.insertAtIndentLevel(closingTag, trimmedHtml, indentLevel);
  }

  insertCommentTag(commentTag: string, html: string, indentLevel: number): string {
    let comment = commentTag.trim().slice(4, -3);
    let oneLineCommentTag = `<!-- ${HtmlFormatter.replaceWhiteSpace(comment, " ")} -->`;
    if (this.isShorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
      return this.insertAtIndentLevel(oneLineCommentTag, html, indentLevel);
    }

    let htmlWithCommentOpening = this.insertAtIndentLevel("<!--", html, indentLevel);
    let htmlWithComment = this.insertText(comment, htmlWithCommentOpening, indentLevel + 2);
    return this.insertAtIndentLevel("-->", htmlWithComment, indentLevel);
  }

  insertText(text: string, html: string, indentLevel: number): string {
    let oneLineText = HtmlFormatter.replaceWhiteSpace(text, " ").trim();
    if (this.isShorterThanCharacterLimit(oneLineText, indentLevel)) {
      return this.insertAtIndentLevel(oneLineText, html, indentLevel);
    }

    let formattedText = text
      .split(HtmlFormatter.PARAGRAPH_DELIMITER_REGEX)
      .map(paragraph => {
        return paragraph
          .split(HtmlFormatter.WHITESPACE_REGEX)
          .reduce((formattedParagraph, word) => {
            let lastLine = formattedParagraph.slice(formattedParagraph.lastIndexOf("\n"));
            if (this.isShorterThanCharacterLimit(lastLine, indentLevel)) {
              return formattedParagraph + (lastLine.trim() === "" ? word : ` ${word}`);
            }
            return this.insertAtIndentLevel(word, formattedParagraph, indentLevel);
          }, this.insertAtIndentLevel("", "", indentLevel));
      })
      .join("\n")
      .trim();

    return this.insertAtIndentLevel(formattedText, html, indentLevel);
  }

  insertWhiteSpace(whitespace: string, html: string): string {
    for (let newlines = 0; newlines < whitespace.split("\n").length - 2; newlines++) {
      html += "\n";
    }
    return html;
  }

  insertVoidTag(voidTag: string, html: string, indentLevel: number) {
    return HtmlFormatter.CLOSING_TAG_REGEX.test(voidTag)
      ? html
      : this.insertOpeningTag(voidTag, html, indentLevel);
  }

  public format(unformattedHtml: string) {
    let indentLevel = 0;

    return unformattedHtml
      .split(HtmlFormatter.HTML_TAG_REGEX)
      .reduce((html, line) => {
        switch (HtmlFormatter.getLineType(line)) {
          case LineType.OPENING_TAG:
            return this.insertOpeningTag(line, html, indentLevel++);
          case LineType.CLOSING_TAG:
            return this.insertClosingTag(line, html, --indentLevel);
          case LineType.VOID_TAG:
            return this.insertVoidTag(line, html, indentLevel);
          case LineType.COMMENT_TAG:
            return this.insertCommentTag(line, html, indentLevel);
          case LineType.TEXT:
            return this.insertText(line, html, indentLevel);
          case LineType.WHITESPACE:
            return this.insertWhiteSpace(line, html);
          default:
            return html;
        }
      }, "")
      .trim() + "\n";
  }
}
export class HtmlFormatter {
  indentSize: number;
  chracterLimit: number;

  constructor(indentSize: number, characterLimit: number) {
    this.indentSize = indentSize;
    this.chracterLimit = characterLimit;
  }

  public format(unformattedHtml: string) {
    let indentLevel = 0;

    return unformattedHtml
      .split(HtmlRegExp.CAPTURE_HTML_TAGS)
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

  insertOpeningTag(openingTag: string, html: string, indentLevel: number): string {
    let tagName = HtmlFormatter.getTagName(openingTag);
    let attributes: Array<string> = openingTag
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

  insertClosingTag(closingTag: string, html: string, indentLevel: number): string {
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

  insertVoidTag(voidTag: string, html: string, indentLevel: number) {
    return HtmlRegExp.CLOSING_TAG.test(voidTag)
      ? html
      : this.insertOpeningTag(voidTag, html, indentLevel);
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
      .split(HtmlRegExp.PARAGRAPH_DELIMITER)
      .map(paragraph => {
        return paragraph
          .split(HtmlRegExp.WHITESPACE)
          .reduce((formattedParagraph, word) => {
            let lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(formattedParagraph);
            let indentedWord = lastLineTrimmed === "" ? "" : " " +  word;
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

  insertWhiteSpace(whitespace: string, html: string): string {
    for (let newlines = 0; newlines < whitespace.split("\n").length - 2; newlines++) {
      html += "\n";
    }
    return html;
  }

  insertAtIndentLevel(textToInsert: string, html: string, indentLevel: number): string {
    html += "\n";
    for (let indent = 0; indent < this.indentSize * indentLevel; indent++) {
      html += " ";
    }
    html += textToInsert;
    return html;
  }

  // Set of "void" tag names, i.e. tags that do not need to be closed.
  private static VOID_ELEMENT_NAMES: Set<string> = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
  ]);

  static getLineType(line: string): LineType {
    return (
      HtmlFormatter.VOID_ELEMENT_NAMES.has(HtmlFormatter.getTagName(line)) ? LineType.VOID_TAG :
        HtmlRegExp.COMMENT_TAG.test(line) ? LineType.COMMENT_TAG :
          HtmlRegExp.CLOSING_TAG.test(line) ? LineType.CLOSING_TAG :
            HtmlRegExp.OPENING_TAG.test(line) ? LineType.OPENING_TAG :
              line.trim() === "" ? LineType.WHITESPACE : LineType.TEXT);
  }

  private static getLastLineTrimmed(text: string): string {
    return text.slice(Math.max(text.lastIndexOf("\n"), 0)).trim();
  };

  private static getTagName(tag: string): string {
    let tagNameMatch = tag.match(HtmlRegExp.TAG_NAME);
    return tagNameMatch ? tagNameMatch[1] : "";
  }

  private static replaceWhiteSpace(text: string, replaceWhiteSpaceWith: string) {
    return text.replace(HtmlRegExp.WHITESPACE, replaceWhiteSpaceWith).trim();
  }

  private isShorterThanCharacterLimit(text: string, indentLevel: number): boolean {
    return indentLevel * this.indentSize + text.length <= this.chracterLimit;
  }
}

export const enum LineType {
  OPENING_TAG,
  CLOSING_TAG,
  VOID_TAG,
  COMMENT_TAG,
  TEXT,
  WHITESPACE
}

const HtmlRegExp = {
  // Matches opening or closing tags and captures their contents.
  CAPTURE_HTML_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
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
  PARAGRAPH_DELIMITER: /\n[\s\n]*\n/,
  // Matches attributes wrapped in double quotes. Ignores espaped quotes inside attributes.
  ATTRIBUTE: /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};
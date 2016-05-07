export const enum LineType {
  OPENING_TAG,
  CLOSING_TAG,
  COMMENT_TAG,
  TEXT,
  WHITESPACE
};

export class HtmlFormatter {
  // Matches opening or closing tags and captures their contents.
  static OPENING_OR_CLOSING_TAG_REGEX: RegExp = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g;
  // Matches opening tags and captures the tag name.
  static OPENING_TAG_REGEX: RegExp = /<[\s\n]*([a-zA-Z0-9-]+)[\S\s]*>/;
  // Matches closing tags and captures the tag name.
  static CLOSING_TAG_REGEX: RegExp = /<[\s\n]*\/[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
  static COMMENT_TAG_REGEX: RegExp = /<!--[\S\s]*?-->/;
  static WHITESPACE_REGEX: RegExp = /[\s\n]+/g;
  // Matches attributes wrapped in double quotes. Ignores espaped quotes inside attributes.
  static ATTRIBUTE_REGEX: RegExp = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
  // Set of "void" tag names, i.e. tags that do not need to be closed.
  static VOID_ELEMENT_NAMES: Set<string> = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
  ]);

  indentSize: number;
  wrappingColumn: number;

  constructor(indentSize: number, wrappingColumn: number) {
    this.indentSize = indentSize;
    this.wrappingColumn = wrappingColumn;
  }

  static getLineType(line: string): LineType {
    if (line.trim() === "") {
      return LineType.WHITESPACE;
    }
    if (line.match(HtmlFormatter.COMMENT_TAG_REGEX)) {
      return LineType.COMMENT_TAG;
    }
    if (line.match(HtmlFormatter.OPENING_TAG_REGEX)) {
      return LineType.OPENING_TAG;
    }
    if (line.match(HtmlFormatter.CLOSING_TAG_REGEX)) {
      return LineType.CLOSING_TAG;
    }
    return LineType.TEXT;
  }

  static getOpeningTagName(openingTag: string): string {
    return openingTag.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
  }

  static getClosingTagName(openingTag: string): string {
    return openingTag.match(HtmlFormatter.CLOSING_TAG_REGEX)[1];
  }

  static isVoidTag(tagName: string): boolean {
    return HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName);
  }

  static replaceWhiteSpace(text: string, replaceWhiteSpaceWith: string) {
    return text.replace(HtmlFormatter.WHITESPACE_REGEX, replaceWhiteSpaceWith).trim()
  }

  isShorterThanWrappingColumn(text: string, indentLevel: number): boolean {
    return indentLevel * this.indentSize + text.length <= this.wrappingColumn;
  }

  insertAtIndentationLevel(textToInsert: string, html: string, indentLevel: number): string {
    html += "\n";
    for (let indent = 0; indent < this.indentSize * indentLevel; indent++) {
      html += " ";
    }
    html += textToInsert;
    return html;
  }

  insertOpeningTag(openingTag: string, html: string, indentLevel: number): string {
    let tagName = HtmlFormatter.getOpeningTagName(openingTag);
    let attributes: Array<string> = openingTag
      .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
      .match(HtmlFormatter.ATTRIBUTE_REGEX) || [];

    let oneLineOpeningTag = attributes && attributes.length ?
      `<${tagName} ${attributes.join(" ")}>` :
      `<${tagName}>`;
    if (this.isShorterThanWrappingColumn(oneLineOpeningTag, indentLevel)) {
      return this.insertAtIndentationLevel(oneLineOpeningTag, html, indentLevel);
    }

    html = this.insertAtIndentationLevel(`<${tagName}`, html, indentLevel);
    attributes.forEach(attribute => {
      html = this.insertAtIndentationLevel(attribute, html, indentLevel + 2);
    });
    return this.insertAtIndentationLevel(">", html, indentLevel);
  }

  insertClosingTag(closingTag: string, html: string, indentLevel: number,
    previousLineType: LineType): string {
    closingTag = HtmlFormatter.replaceWhiteSpace(closingTag, "");
    if (previousLineType === LineType.OPENING_TAG) {
      return html + closingTag;
    }

    let openingTagIndex = html.lastIndexOf(`<${HtmlFormatter.getClosingTagName(closingTag)}`);
    let oneLineElement = html
      .slice(openingTagIndex)
      .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
      .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
      .join("") + closingTag;

    if (oneLineElement.match(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX).length === 2 &&
      this.isShorterThanWrappingColumn(oneLineElement, indentLevel)) {
      return html.slice(0, openingTagIndex) + oneLineElement;
    }
    return this.insertAtIndentationLevel(closingTag, html, indentLevel);
  }

  insertText(text: string, html: string, indentLevel: number): string {
    let oneLineText = HtmlFormatter.replaceWhiteSpace(text, " ");
    if (this.isShorterThanWrappingColumn(oneLineText, indentLevel)) {
      return this.insertAtIndentationLevel(oneLineText, html, indentLevel);
    }
    return this.insertAtIndentationLevel(text.trim(), html, indentLevel);
  }

  public format(unformattedHtml: string) {
    let html = "";
    let indentLevel = 0;
    let previousLineType = LineType.WHITESPACE;

    unformattedHtml
      .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
      .forEach(line => {
        let lineType = HtmlFormatter.getLineType(line);
        let tagName = "";

        switch (lineType) {
          case LineType.OPENING_TAG:
            html = this.insertOpeningTag(line, html, indentLevel);
            indentLevel += HtmlFormatter.isVoidTag(HtmlFormatter.getOpeningTagName(line)) ? 0 : 1;
            break;
          case LineType.CLOSING_TAG:
            if (!HtmlFormatter.isVoidTag(HtmlFormatter.getClosingTagName(line))) {
              --indentLevel;
              html = this.insertClosingTag(line, html, indentLevel, previousLineType)
            }
            break;
          case LineType.COMMENT_TAG:
          case LineType.TEXT:
            html = this.insertText(line, html, indentLevel);
            break;
          case LineType.WHITESPACE:
            for (let i = 0; i < line.split("\n").length - 2; i++) {
              html += "\n";
            }
            lineType = previousLineType;
            break;
        }

        previousLineType = lineType;
      });

    return html.trim() + "\n";
  }
}
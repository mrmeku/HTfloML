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
  static OPENING_OR_CLOSING_TAG_REGEX: RegExp = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g;
  // Matches opening tags and captures the tag name.
  static OPENING_TAG_REGEX: RegExp = /<[\s\n]*([a-zA-Z0-9-]+)[\S\s]*>/;
  // Matches closing tags and captures the tag name.
  static CLOSING_TAG_REGEX: RegExp = /<[\s\n]*\/[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
  // Matches comment tags.
  static COMMENT_TAG_REGEX: RegExp = /<!--[\S\s]*?-->/;
  // Matches whitespace (including new lines).
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

  static getTagName(tag: string): string {
    let openingTagName = tag.match(HtmlFormatter.OPENING_TAG_REGEX)
    let closingTagName = tag.match(HtmlFormatter.CLOSING_TAG_REGEX);
    return openingTagName ? openingTagName[1] : closingTagName ? closingTagName[1] : null;
  }

  static getLineType(line: string): LineType {
    let tagName = HtmlFormatter.getTagName(line);

    return HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName) ? LineType.VOID_TAG :
      HtmlFormatter.COMMENT_TAG_REGEX.test(line) ? LineType.COMMENT_TAG :
      HtmlFormatter.CLOSING_TAG_REGEX.test(line) ? LineType.CLOSING_TAG :
      HtmlFormatter.OPENING_TAG_REGEX.test(line) ? LineType.OPENING_TAG :
      line.trim() === "" ? LineType.WHITESPACE : LineType.TEXT;
  }

  static replaceWhiteSpace(text: string, replaceWhiteSpaceWith: string) {
    return text.replace(HtmlFormatter.WHITESPACE_REGEX, replaceWhiteSpaceWith).trim();
  }

  isShorterThanWrappingColumn(text: string, indentLevel: number): boolean {
    return indentLevel * this.indentSize + text.length <= this.wrappingColumn;
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

    let oneLineOpeningTag = attributes && attributes.length ?
      `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
    if (this.isShorterThanWrappingColumn(oneLineOpeningTag, indentLevel)) {
      return this.insertAtIndentLevel(oneLineOpeningTag, html, indentLevel);
    }

    html = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
    attributes.forEach(attribute => {
      html = this.insertAtIndentLevel(attribute, html, indentLevel + 2);
    });
    return this.insertAtIndentLevel(">", html, indentLevel);
  }

  insertClosingTag(closingTag: string, html: string, indentLevel: number,
    preceededByOpeningTag: boolean): string {
    closingTag = HtmlFormatter.replaceWhiteSpace(closingTag, "");
    if (preceededByOpeningTag) {
      return html + closingTag;
    }

    let indexOfOpeningTag = html.lastIndexOf(`<${HtmlFormatter.getTagName(closingTag)}`);
    let normalizedElement = html
      .slice(indexOfOpeningTag)
      .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
      .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
      .join("") + closingTag;

    if (normalizedElement.match(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX).length === 2 &&
      this.isShorterThanWrappingColumn(normalizedElement, indentLevel)) {
      return html.slice(0, indexOfOpeningTag) + normalizedElement;
    }

    return this.insertAtIndentLevel(closingTag, html, indentLevel);
  }

  insertText(text: string, html: string, indentLevel: number): string {
    let normalizedText = HtmlFormatter.replaceWhiteSpace(text, " ");
    text = this.isShorterThanWrappingColumn(normalizedText, indentLevel) ? normalizedText : text;
    return this.insertAtIndentLevel(text.trim(), html, indentLevel);
  }

  public format(unformattedHtml: string) {
    let html = "";
    let indentLevel = 0;
    let preceededByOpeningTag = false;

    unformattedHtml
      .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
      .forEach(line => {
        let lineType = HtmlFormatter.getLineType(line);
        switch (lineType) {
          case LineType.VOID_TAG:
            html = this.insertOpeningTag(line, html, indentLevel);
            break;
          case LineType.OPENING_TAG:
            html = this.insertOpeningTag(line, html, indentLevel);
            ++indentLevel;
            break;
          case LineType.CLOSING_TAG:
            --indentLevel;
            html = this.insertClosingTag(line, html, indentLevel, preceededByOpeningTag);
            break;
          case LineType.COMMENT_TAG:
          case LineType.TEXT:
            html = this.insertText(line, html, indentLevel);
            break;
          case LineType.WHITESPACE:
            for (let newlines = 0; newlines < line.split("\n").length - 2; newlines++) {
              html += "\n";
            }
            break;
        }
        preceededByOpeningTag = lineType === LineType.OPENING_TAG ||
          lineType === LineType.WHITESPACE && preceededByOpeningTag;
      });

    return html.trim() + "\n";
  }
}
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

  static getTagName(tag: string): string {
    let tagNameMatch = tag.match(HtmlFormatter.OPENING_TAG_REGEX) ||
      tag.match(HtmlFormatter.CLOSING_TAG_REGEX);
    return tagNameMatch ? tagNameMatch[1] : undefined;
  }

  static getLineType(line: string): LineType {
    let tagName = HtmlFormatter.getTagName(line);

    return (
      HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName) ? LineType.VOID_TAG :
        HtmlFormatter.COMMENT_TAG_REGEX.test(line) ? LineType.COMMENT_TAG :
          HtmlFormatter.CLOSING_TAG_REGEX.test(line) ? LineType.CLOSING_TAG :
            HtmlFormatter.OPENING_TAG_REGEX.test(line) ? LineType.OPENING_TAG :
              line.trim() === "" ? LineType.WHITESPACE : LineType.TEXT);
  }

  static replaceWhiteSpace(text: string, replaceWhiteSpaceWith: string) {
    return text.replace(HtmlFormatter.WHITESPACE_REGEX, replaceWhiteSpaceWith).trim();
  }

  indentSize: number;
  wrappingColumn: number;

  constructor(indentSize: number, wrappingColumn: number) {
    this.indentSize = indentSize;
    this.wrappingColumn = wrappingColumn;
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

    openingTag = attributes && attributes.length ?
      `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
    if (this.isShorterThanWrappingColumn(openingTag, indentLevel)) {
      return this.insertAtIndentLevel(openingTag, html, indentLevel);
    }

    html = this.insertAtIndentLevel(`<${tagName}`, html, indentLevel);
    html = attributes.reduce(
      (html, attribute) => this.insertAtIndentLevel(attribute, html, indentLevel + 2), html);
    return this.insertAtIndentLevel(">", html, indentLevel);
  }

  insertClosingTag(closingTag: string, html: string, indentLevel: number): string {
    let tagName = HtmlFormatter.getTagName(closingTag);
    closingTag = `</${tagName}>`

    let elementStartIndex = html.lastIndexOf(`<${tagName}`);

    let elementLines = html
      .slice(elementStartIndex)
      .split(HtmlFormatter.HTML_TAG_REGEX)
      .filter(line => line !== "");

    let elementEndIndex = elementStartIndex + elementLines[0].length;

    let element = elementLines
      .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
      .join("") + closingTag;

    if (this.isShorterThanWrappingColumn(element, indentLevel) &&
      element.match(HtmlFormatter.HTML_TAG_REGEX).length === 2) {
      return html.slice(0, elementStartIndex) + element;
    }

    html = html.trim();
    let endingTagLine = html.slice(html.lastIndexOf("\n")) + closingTag;
    let preceededByOpeningTag = html.length <= elementEndIndex + 1;
    if (preceededByOpeningTag && this.isShorterThanWrappingColumn(endingTagLine, indentLevel)) {
      return html + closingTag;
    }

    return this.insertAtIndentLevel(closingTag, html, indentLevel);
  }

  insertCommentTag(commentTag: string, html: string, indentLevel: number): string {
    let comment = commentTag.trim().slice(4, -3);
    commentTag = `<!-- ${HtmlFormatter.replaceWhiteSpace(comment, " ")} -->`;
    if (this.isShorterThanWrappingColumn(commentTag, indentLevel)) {
      return this.insertAtIndentLevel(commentTag, html, indentLevel);
    } else {
      html = this.insertAtIndentLevel("<!--", html, indentLevel);
      html = this.insertText(comment, html, indentLevel + 2);
      html = this.insertAtIndentLevel("-->", html, indentLevel);
    }
    return html;
  }

  insertText(text: string, html: string, indentLevel: number): string {
    let formattedText = text.replace(HtmlFormatter.WHITESPACE_REGEX, " ");

    if (!this.isShorterThanWrappingColumn(formattedText, indentLevel)) {
      formattedText = text
        .trim()
        .split("\n")
        .map(section => {
          let currentLine = this.insertAtIndentLevel("", "", indentLevel).slice(1);
          section = section
            .split(HtmlFormatter.WHITESPACE_REGEX)
            .reduce((section, currentWord) => {
              currentWord = currentWord.trim();
              let line = `${currentLine} ${currentWord}`;
              if (!this.isShorterThanWrappingColumn(line, indentLevel)) {
                section = this.insertAtIndentLevel(currentLine.trim(), section, indentLevel);
                line = this.insertAtIndentLevel(currentWord, "", indentLevel).slice(1);
              }
              currentLine = line;
              return section;
            }, "");
          if (currentLine.trim() !== "") {
            section = this.insertAtIndentLevel(currentLine.trim(), section, indentLevel);
          } else {
            section = this.insertWhiteSpace(currentLine + "\n\n", section);
          }
          return section;
        }).join("");
    }

    return this.insertAtIndentLevel(formattedText.trim(), html, indentLevel);
  }

  insertWhiteSpace(whitespace: string, html: string): string {
    for (let newlines = 0; newlines < whitespace.split("\n").length - 2; newlines++) {
      html += "\n";
    }
    return html;
  }

  public format(unformattedHtml: string) {
    let indentLevel = 0;

    return unformattedHtml
      .split(HtmlFormatter.HTML_TAG_REGEX)
      .reduce((html, line) => {
        switch (HtmlFormatter.getLineType(line)) {
          case LineType.VOID_TAG:
            return this.insertOpeningTag(line, html, indentLevel);
          case LineType.OPENING_TAG:
            return this.insertOpeningTag(line, html, indentLevel++);
          case LineType.CLOSING_TAG:
            return this.insertClosingTag(line, html, --indentLevel);
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
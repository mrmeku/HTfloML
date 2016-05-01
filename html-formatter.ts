enum LineType {
  OPENING_TAG,
  CLOSING_TAG,
  COMMENT_TAG,
  TEXT,
  WHITESPACE
};

export class HtmlFormatter {
  static LineType = LineType;

  // Matches opening or closing tags and captures their contents.
  static OPENING_OR_CLOSING_TAG_REGEX: RegExp = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/;
  // Matches opening tags and captures the tag name.
  static OPENING_TAG_REGEX: RegExp = /<[\s\n]*([a-zA-Z0-9-]+)[\S\s]*>/;
  // Matches closing tags and captures the tag name.
  static CLOSING_TAG_REGEX: RegExp = /<[\s\n]*\/[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
  static COMMENT_TAG_REGEX: RegExp = /<!--[\S\s]*?-->/
  static WHITESPACE_REGEX: RegExp = /[\s\n]+/;
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
    if (line.match(HtmlFormatter.OPENING_TAG_REGEX)) {
      return LineType.OPENING_TAG;
    }
    if (line.match(HtmlFormatter.CLOSING_TAG_REGEX)) {
      return LineType.CLOSING_TAG;
    }
    if (line.match(HtmlFormatter.COMMENT_TAG_REGEX)) {
      return LineType.COMMENT_TAG;
    }
    return LineType.TEXT;
  }

  insertAtIndentationLevel(
    textToInsert: string,
    formattedHtml: string,
    indentLevel: number): string {
    formattedHtml += "\n";
    let spacesInserted = 0;
    while (spacesInserted < this.indentSize * indentLevel) {
      formattedHtml += " ";
      ++spacesInserted;
    }
    formattedHtml += textToInsert;
    return formattedHtml;
  }

  insertOpeningTag(
    openingTag: string,
    tagName: string,
    formattedHtml: string,
    indentLevel: number): string {
    let attributes: Array<string> = openingTag
      .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
      .match(HtmlFormatter.ATTRIBUTE_REGEX);

    let formattedOpeningTag = attributes && attributes.length ?
      `<${tagName} ${attributes.join(" ")}>` :
      `<${tagName}>`;

    if (formattedOpeningTag.length <= this.wrappingColumn) {
      return this.insertAtIndentationLevel(formattedOpeningTag, formattedHtml, indentLevel);
    } else {
      formattedHtml = this.insertAtIndentationLevel(`<${tagName}`, formattedHtml, indentLevel);
      attributes.forEach(attribute => {
        formattedHtml = this.insertAtIndentationLevel(attribute, formattedHtml, indentLevel + 2);
      });
      return this.insertAtIndentationLevel(">", formattedHtml, indentLevel);
    }
  }

  insertClosingTag(
      closingTag: string,
      tagName: string,
      formattedHtml: string,
      indentLevel: number) {
    let formattedClosingTag = closingTag.replace(HtmlFormatter.WHITESPACE_REGEX, "");
    let openingTagIndex = formattedHtml.lastIndexOf(`<${tagName}`);
    let completeTagParts = formattedHtml
        .slice(openingTagIndex)
        .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
        .map(line => line.trim())
        .filter((line) => line !== "");
    let completeTag = completeTagParts.join("") + formattedClosingTag;

    if (completeTagParts.length === 1 ||
        indentLevel * this.indentSize + completeTag.length <= this.wrappingColumn) {
      return formattedHtml.slice(0, openingTagIndex) + completeTag;
    }
    return this.insertAtIndentationLevel(formattedClosingTag, formattedHtml, indentLevel);
  }

  public format(html: string) {
    let formattedHtml = "";
    let indentLevel = 0;

    html
      .trim()
      .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
      .filter((line) => line !== "")
      .forEach(line => {
        let lineType = HtmlFormatter.getLineType(line);
        let tagName = "";

        switch (lineType) {
          case LineType.OPENING_TAG:
            tagName = line.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
            formattedHtml = this.insertOpeningTag(line, tagName, formattedHtml, indentLevel);
            indentLevel += HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName) ? 0 : 1;
            break;
          case LineType.CLOSING_TAG:
            if (!HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName)) {
              --indentLevel;
              tagName = line.match(HtmlFormatter.CLOSING_TAG_REGEX)[1];
              formattedHtml = this.insertClosingTag(line, tagName, formattedHtml, indentLevel)
            }
            break;
          case LineType.COMMENT_TAG:
          case LineType.TEXT:
            formattedHtml = this.insertAtIndentationLevel(line.trim(), formattedHtml, indentLevel);
            break;
          case LineType.WHITESPACE:
            for (let i = 0; i < line.split("\n").length - 2; i++) {
              formattedHtml += "\n";
            }
            break;
        }
      });

    return formattedHtml.trim() + "\n";
  }
}
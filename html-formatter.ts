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
  static OPENING_OR_CLOSING_TAG_REGEX: RegExp = new RegExp("(<[\\S\\s]*?>)");
  // Matches opening tags and captures the tag name.
  static OPENING_TAG_REGEX: RegExp = new RegExp(
    "<[\\s\\n]*([a-zA-Z]+)[\\S\\s]*>");
  static CLOSING_TAG_REGEX: RegExp = new RegExp(
    "<[\\s\\n]*/[\\s\\n]*([a-zA-Z]+)[\\S\\s]*?>");
  static COMMENT_TAG_REGEX: RegExp = new RegExp("<!--[\\S\\s]*?-->")
  static WHITESPACE_REGEX: RegExp = new RegExp("[\\s\\n]+");
  static ATTRIBUTE_REGEX: RegExp = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
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
      formattedHtml = this.insertAtIndentationLevel(formattedOpeningTag, formattedHtml, indentLevel);
    } else {
      formattedHtml = this.insertAtIndentationLevel(`<${tagName}`, formattedHtml, indentLevel);
      attributes.forEach(attribute => {
        formattedHtml = this.insertAtIndentationLevel(attribute, formattedHtml, indentLevel + 2);
      });
      formattedHtml = this.insertAtIndentationLevel(">", formattedHtml, indentLevel);
    }
    return formattedHtml;
  }

  insertClosingTag(
    closingTag: string,
    formattedHtml: string,
    indentLevel: number,
    previousLineType: LineType) {
    let formattedClosingTag = closingTag.replace(HtmlFormatter.WHITESPACE_REGEX, "");
    // Put closing tag on same line as opening tag if there's enough room.
    if (previousLineType === LineType.OPENING_TAG) {
      let previousLine = formattedHtml.slice(formattedHtml.lastIndexOf("\n"));
      if (previousLine.length + formattedClosingTag.length <= this.wrappingColumn) {
        return formattedHtml + formattedClosingTag;
      }
    }
    return this.insertAtIndentationLevel(formattedClosingTag, formattedHtml, indentLevel);
  }

  insertText(text: string, formattedHtml: string, indentLevel: number): string {
    // TODO: Break up text into multiple lines if it goes past wrappingColumn.
    return this.insertAtIndentationLevel(text.trim(), formattedHtml, indentLevel);
  }

  public format(html: string) {
    let formattedHtml = "";
    let indentLevel = 0;
    let previousLineType: LineType = LineType.TEXT;

    html.split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
      .filter((line) => line !== "")
      .forEach(line => {
        let lineType = HtmlFormatter.getLineType(line);
        switch (HtmlFormatter.getLineType(line)) {
          case LineType.OPENING_TAG:
            let tagName = line.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
            formattedHtml = this.insertOpeningTag(
              line, tagName, formattedHtml, indentLevel);
            if (!HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName)) {
              ++indentLevel;
            }
            break;
          case LineType.CLOSING_TAG:
            --indentLevel;
            formattedHtml = this.insertClosingTag(
              line, formattedHtml, indentLevel, previousLineType);
            break;
          case LineType.COMMENT_TAG:
          case LineType.TEXT:
            formattedHtml = this.insertText(
              line, formattedHtml, indentLevel);
            break;
          case LineType.WHITESPACE:
            for (let i = 0; i < line.split("\n").length - 2; i++) {
              formattedHtml += "\n";
            }
            lineType = previousLineType;
        }
        previousLineType = lineType;
      });
    return formattedHtml.trim();
  }
}
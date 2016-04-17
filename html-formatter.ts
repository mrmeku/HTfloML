enum LineType {
  OPENING_TAG,
  CLOSING_TAG,
  COMMENT_TAG,
  TEXT,
  WHITESPACE
};

class HtmlFormatter {
  // Matches opening or closing tags and captures their contents.
  static OPENING_OR_CLOSING_TAG_REGEX: RegExp = new RegExp("(<[\\S\\s]*?>)");
  // Matches opening tags and captures the tag name.
  static OPENING_TAG_REGEX: RegExp = new RegExp(
    "<[\\s\\n]*([a-zA-Z]+)[\\S\\s]*>");
  static CLOSING_TAG_REGEX: RegExp = new RegExp(
    "<[\\s\\n]*/[\\s\\n]*([a-zA-Z]+)[\\S\\s]*?>");
  static COMMENT_TAG_REGEX: RegExp = new RegExp("<!--[\\S\\s]*?-->")
  static WHITESPACE_REGEX: RegExp = new RegExp("[\\s\\n]+");
  static ATTRIBUTE_REGEX: RegExp = new RegExp(
    "([a-zA-Z\-]*?=[\"'][\\S\\s]*?['\"])");

  indentationSize: number;
  wrappingColumn: number;

  constructor(indentationSize: number, wrappingColumn: number) {
    this.indentationSize = indentationSize;
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
    indentationLevel: number): string {
    formattedHtml += "\n";
    let spacesInserted = 0;
    while (spacesInserted < this.indentationSize * indentationLevel) {
      formattedHtml += " ";
      ++spacesInserted;
    }
    formattedHtml += textToInsert;
    return formattedHtml;
  }

  insertOpeningTag(
    openingTag: string,
    formattedHtml: string,
    indentationLevel: number,
    previousLineType: LineType): string {
    let tagName: string = openingTag.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
    let attributes: Array<string> = openingTag
      .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
      .split(HtmlFormatter.ATTRIBUTE_REGEX)
      .filter(attribute => attribute.trim() !== "");

    let formattedOpeningTag = attributes.length ?
      `<${tagName} ${attributes.join(" ")}>` :
      `<${tagName}>`;

    if (formattedOpeningTag.length <= this.wrappingColumn) {
      formattedHtml = this.insertAtIndentationLevel(formattedOpeningTag, formattedHtml, indentationLevel);
    } else {
      formattedHtml = this.insertAtIndentationLevel(`<${tagName}`, formattedHtml, indentationLevel);
      attributes.forEach(attribute => {
        formattedHtml = this.insertAtIndentationLevel(attribute, formattedHtml, indentationLevel + 2);
      });
      formattedHtml = this.insertAtIndentationLevel(">", formattedHtml, indentationLevel);
    }
    return formattedHtml;
  }

  insertClosingTag(
    closingTag: string,
    formattedHtml: string,
    indentationLevel: number,
    previousLineType: LineType) {
    let formattedClosingTag = closingTag.replace(HtmlFormatter.WHITESPACE_REGEX, "");
    // Put closing tag on same line as opening tag if there's enough room.
    if (previousLineType === LineType.OPENING_TAG) {
      let previousLine = formattedHtml.slice(formattedHtml.lastIndexOf("\n"));
      if (previousLine.length + formattedClosingTag.length <= this.wrappingColumn) {
        return formattedHtml + formattedClosingTag;
      }
    }
    return this.insertAtIndentationLevel(formattedClosingTag, formattedHtml, indentationLevel);
  }

  insertText(
    text: string,
    formattedHtml: string,
    indentationLevel: number,
    previousLineType: LineType): string {
    // TODO: Break up text into multiple lines if it goes past wrappingColumn.
    return this.insertAtIndentationLevel(text.trim(), formattedHtml, indentationLevel);
  }

  public format(html: string) {
    let formattedHtml = "";
    let indentationLevel = 0;
    let previousLineType: LineType = LineType.TEXT;

    html.split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
      .filter((line) => line !== "")
      .forEach(line => {
        let lineType = HtmlFormatter.getLineType(line);
        switch (HtmlFormatter.getLineType(line)) {
          case LineType.OPENING_TAG:
            formattedHtml = this.insertOpeningTag(
              line, formattedHtml, indentationLevel, previousLineType);
            ++indentationLevel;
            break;
          case LineType.CLOSING_TAG:
            --indentationLevel;
            formattedHtml = this.insertClosingTag(
              line, formattedHtml, indentationLevel, previousLineType);
            break;
          case LineType.COMMENT_TAG:
          case LineType.TEXT:
            formattedHtml = this.insertText(
              line, formattedHtml, indentationLevel, previousLineType);
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
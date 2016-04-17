var LineType;
(function (LineType) {
    LineType[LineType["OPENING_TAG"] = 0] = "OPENING_TAG";
    LineType[LineType["CLOSING_TAG"] = 1] = "CLOSING_TAG";
    LineType[LineType["COMMENT_TAG"] = 2] = "COMMENT_TAG";
    LineType[LineType["TEXT"] = 3] = "TEXT";
    LineType[LineType["WHITESPACE"] = 4] = "WHITESPACE";
})(LineType || (LineType = {}));
;
class HtmlFormatter {
    constructor(indentSize, wrappingColumn) {
        this.indentSize = indentSize;
        this.wrappingColumn = wrappingColumn;
    }
    static getLineType(line) {
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
    insertAtIndentationLevel(textToInsert, formattedHtml, indentLevel) {
        formattedHtml += "\n";
        let spacesInserted = 0;
        while (spacesInserted < this.indentSize * indentLevel) {
            formattedHtml += " ";
            ++spacesInserted;
        }
        formattedHtml += textToInsert;
        return formattedHtml;
    }
    insertOpeningTag(openingTag, tagName, formattedHtml, indentLevel) {
        let attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .split(HtmlFormatter.ATTRIBUTE_REGEX)
            .filter(attribute => attribute.trim() !== "");
        let formattedOpeningTag = attributes.length ?
            `<${tagName} ${attributes.join(" ")}>` :
            `<${tagName}>`;
        if (formattedOpeningTag.length <= this.wrappingColumn) {
            formattedHtml = this.insertAtIndentationLevel(formattedOpeningTag, formattedHtml, indentLevel);
        }
        else {
            formattedHtml = this.insertAtIndentationLevel(`<${tagName}`, formattedHtml, indentLevel);
            attributes.forEach(attribute => {
                formattedHtml = this.insertAtIndentationLevel(attribute, formattedHtml, indentLevel + 2);
            });
            formattedHtml = this.insertAtIndentationLevel(">", formattedHtml, indentLevel);
        }
        return formattedHtml;
    }
    insertClosingTag(closingTag, formattedHtml, indentLevel, previousLineType) {
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
    insertText(text, formattedHtml, indentLevel) {
        // TODO: Break up text into multiple lines if it goes past wrappingColumn.
        return this.insertAtIndentationLevel(text.trim(), formattedHtml, indentLevel);
    }
    format(html) {
        let formattedHtml = "";
        let indentLevel = 0;
        let previousLineType = LineType.TEXT;
        html.split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .filter((line) => line !== "")
            .forEach(line => {
            let lineType = HtmlFormatter.getLineType(line);
            switch (HtmlFormatter.getLineType(line)) {
                case LineType.OPENING_TAG:
                    let tagName = line.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
                    formattedHtml = this.insertOpeningTag(line, tagName, formattedHtml, indentLevel);
                    if (!HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName)) {
                        ++indentLevel;
                    }
                    break;
                case LineType.CLOSING_TAG:
                    --indentLevel;
                    formattedHtml = this.insertClosingTag(line, formattedHtml, indentLevel, previousLineType);
                    break;
                case LineType.COMMENT_TAG:
                case LineType.TEXT:
                    formattedHtml = this.insertText(line, formattedHtml, indentLevel);
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
// Matches opening or closing tags and captures their contents.
HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX = new RegExp("(<[\\S\\s]*?>)");
// Matches opening tags and captures the tag name.
HtmlFormatter.OPENING_TAG_REGEX = new RegExp("<[\\s\\n]*([a-zA-Z]+)[\\S\\s]*>");
HtmlFormatter.CLOSING_TAG_REGEX = new RegExp("<[\\s\\n]*/[\\s\\n]*([a-zA-Z]+)[\\S\\s]*?>");
HtmlFormatter.COMMENT_TAG_REGEX = new RegExp("<!--[\\S\\s]*?-->");
HtmlFormatter.WHITESPACE_REGEX = new RegExp("[\\s\\n]+");
HtmlFormatter.ATTRIBUTE_REGEX = new RegExp("([a-zA-Z\-]*?=[\"'][\\S\\s]*?['\"])");
HtmlFormatter.VOID_ELEMENT_NAMES = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
//# sourceMappingURL=html-formatter.js.map
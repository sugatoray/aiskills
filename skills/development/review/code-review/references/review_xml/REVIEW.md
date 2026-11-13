# XML review

What to look for in XML (`.xml`, `.xsd`, `.xsl`, `.xslt`, and XML-based formats such as SVG,
Maven POMs, Android resources, RSS, SOAP and Office documents), beyond `../CROSS_LANGUAGE.md`.
Two things are under review: the document itself, and the code that parses or produces it.
XML is a **tool-first** format: run the checks in `TOOLING.md` before reading, let them decide
well-formedness, validity and formatting, and then carry out the whole of this review.
`PATTERNS.md` has the fix for the common items, `TOOLING.md` the commands, `SECURITY.md` the
security scope, and `WISDOM.md` the constraints and traps to keep in mind for every XML review.

## Before you start

- **What the document is for.** Configuration read by a tool (Maven, Spring, Ant, MSBuild,
  Android), data exchanged with another system, a schema (XSD), a transform (XSLT), or a
  document shown to people (SVG, DocBook). The reader decides which mistakes matter.
- **Who else reads it.** A schema or element change in an exchanged format is an API change:
  find the consumers and the compatibility promise.
- **What validates it.** An XSD, DTD, RELAX NG or Schematron file, and whether validation runs
  in CI or at run time. If nothing validates it, the consuming code is the only specification.
- **Which parser and which settings.** The library, its version, and how it is configured for
  DTDs, external entities and XInclude (`SECURITY.md`).

## Well-formedness and encoding

- **Not well-formed:** unclosed or overlapping elements, unquoted attributes, two root
  elements, a duplicate attribute on one element. A conforming parser must stop at the first
  such error, so the whole file is lost.
- **Unescaped `&` and `<`** in text or attribute values, typically from a URL with a query
  string or from text pasted in. Use `&amp;` and `&lt;`, or a CDATA section for text.
- **`]]>` inside a CDATA section** ends it early.
- **Encoding declared and actual encoding differ** (`encoding="UTF-8"` on a file saved as
  Windows-1252, or the reverse): parse errors or silently wrong characters.
- **Anything before the XML declaration,** including a blank line or a byte-order mark followed
  by whitespace: the declaration must be the first thing in the file.
- **Characters XML 1.0 forbids** (most control characters below U+0020) written into a document
  from program data. They cannot be escaped in XML 1.0; they must be removed or encoded.
- **HTML entity names** (`&nbsp;`, `&copy;`) in XML that declares no DTD: only `&lt;`, `&gt;`,
  `&amp;`, `&apos;` and `&quot;` are predefined. Use numeric references (`&#160;`).

## Namespaces

- **Element or attribute in the wrong namespace, or none.** A missing or misspelled `xmlns`
  makes every element a different name to the consumer, which then finds nothing and often
  reports no error.
- **Code or XPath that matches on the prefix** rather than the namespace URI. Prefixes are
  arbitrary and can change; the URI is the name.
- **XPath with unprefixed names against a document that has a default namespace:** in XPath 1.0
  an unprefixed name means "no namespace", so the expression selects nothing.
- **Unprefixed attributes assumed to be in the element's namespace.** They are in no
  namespace; a default namespace does not apply to attributes.
- **Undeclared prefixes,** and the same prefix bound to different URIs in one document where a
  reader would be misled.

## Schema and structure

- **A change to an exchanged format that breaks existing readers or writers:** a new required
  element or attribute, a removed or renamed one, a narrowed type, a changed namespace.
  Additive and optional is the compatible direction.
- **Document and schema out of step:** the sample or fixture no longer validates, or the
  schema was changed without the code that reads the documents.
- **Schemas so loose they check nothing** (`xs:any` with `processContents="skip"`,
  everything `xs:string`, everything optional), or `minOccurs`/`maxOccurs` that don't match
  what the code assumes.
- **Element order.** `xs:sequence` makes order significant; a document with the right elements
  in the wrong order is invalid.
- **Meaningful data in comments or processing instructions,** or dependence on attribute
  order or insignificant whitespace: parsers and serialisers do not preserve these reliably.
- **Whitespace-sensitive values** (`<port> 8080 </port>`) read without trimming, and
  `xml:space="preserve"` missing where whitespace matters.
- **Identifiers** (`xs:ID`, `id` attributes) duplicated, or references to ids that don't exist.

## Code that reads XML

- **String or regular-expression parsing of XML.** It breaks on attribute order, quoting,
  namespaces, CDATA, entities and comments. Use a parser.
- **Missing-node handling:** `find()` returning `None`/`null` and the code dereferencing it;
  `findtext` returning `None` against an empty string; a list assumed non-empty.
- **Text content assumptions:** mixed content, text split across several nodes, an empty
  element against an absent one (`<a/>` and no `<a>` at all usually mean different things).
- **Whole-document parsing of large or unbounded input** where a streaming parser
  (`iterparse`, StAX, SAX, `XmlReader`) fits, and `iterparse` loops that never clear processed
  elements.
- **Parser configuration** left at defaults that resolve DTDs or external entities for
  untrusted input (`SECURITY.md`).

## Code that writes XML

- **Building XML by string concatenation or templates without escaping.** The output breaks,
  or changes meaning, when a value contains `<`, `&`, a quote or `]]>`. Use a serialiser.
- **No XML declaration or encoding** on output that is not UTF-8, or bytes written in a
  different encoding from the one declared.
- **Pretty-printing that changes meaning** in mixed content or whitespace-sensitive values.

## XSLT and XPath

- **XPath built from input** by concatenation (`SECURITY.md`).
- **`//` at the start of expressions** inside loops or templates over large documents: a
  full-document scan each time. Use a relative path or `xsl:key`.
- **Version mismatches:** XSLT 2.0 or 3.0 features (`xsl:for-each-group`, sequences,
  regular-expression functions) run on a 1.0 processor such as libxslt or the browsers'.
- **Templates that match more than intended,** conflicting matches resolved by priority rules
  the author didn't mean, and reliance on the built-in templates copying text through.
- **`disable-output-escaping`,** which is optional for processors and unsafe with untrusted
  text.

## Tool-specific configuration

- **Maven:** dependencies without a version outside `dependencyManagement`, `SNAPSHOT` or
  version ranges in a release, plugins without a pinned version, `http://` repositories,
  `scope` wrong for the use (`test` libraries shipped in the artefact).
- **Spring, Ant, MSBuild, Android manifests:** review as code. A changed bean, target or
  permission is a behaviour change; `android:exported="true"` and `android:debuggable` are
  security-relevant.
- **Secrets** in configuration (`SECURITY.md`).

## Security

Read `SECURITY.md` for the full scope. The items that most often matter in ordinary review:
parsers that resolve external entities or DTDs on untrusted input, entity-expansion and size
limits, XPath or XML built from input, scripts in SVG, and XSLT run on untrusted stylesheets.

## Usually not worth a finding

- Indentation, attribute order, `<a/>` against `<a></a>`, single against double quotes.
- Prefix choice, where the namespace URI is right.
- A missing XML declaration on a UTF-8 file.
- Formatting churn from a tool the project runs.

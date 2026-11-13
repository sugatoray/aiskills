# XML security review

The security scope for XML documents and for code that parses, transforms or produces them.
It is read for the security pass of a full review, and on its own, with `WISDOM.md`, when the
review runs with `-s`/`--security`. Rate findings with `../SEVERITY.md` and report them with
`../REPORT_TEMPLATE.md`.

## Scope

In scope: external entities and DTDs, entity expansion and other resource exhaustion,
XInclude, XSLT run on untrusted input, XPath and XML injection, script in SVG, secrets and
security-relevant settings in XML configuration.

Establish first:

- **Who supplies the XML.** A file in the repository is trusted as much as its author. A
  request body, an upload, a feed or a document from a partner is not.
- **Which parser reads it, at which version, with which settings.** The same document is
  harmless to one configuration and a file disclosure to another. Defaults have changed over
  time: check the version in use, not what a newer release does.
- **What the process can reach:** local files, internal hosts, cloud metadata endpoints.

## Where untrusted data enters

- Request bodies (SOAP, XML-RPC, SAML assertions, REST with an XML content type), uploads
  (SVG, Office documents, which are zipped XML), feeds (RSS, Atom), sitemaps, partner files.
- Stylesheets, schemas and DTDs named by the document or supplied with it.
- Values spliced into XML or XPath that the program builds.
- XML configuration that a lower-privileged user or a pull request can change.

## Checks

### External entities and DTDs

- **A parser that resolves external entities on untrusted input** (XXE). An entity declared
  `SYSTEM "file:///…"` or `SYSTEM "http://internal/…"` is replaced by that resource's
  content, which is then returned, logged or sent on. Parameter entities and an external DTD
  do the same without the content ever appearing in the document.
- **The safest setting refuses the DOCTYPE altogether.** Where DTDs must be accepted,
  external general entities, external parameter entities and external DTD loading must each
  be off. Look for the setting; do not assume it:
  - **Python:** the standard library parsers do not fetch external entities but do expand
    internal ones; `defusedxml` rejects both. For `lxml`, pass
    `XMLParser(resolve_entities=False, no_network=True, load_dtd=False)`.
  - **Java:** `DocumentBuilderFactory`, `SAXParserFactory`, `XMLInputFactory`,
    `TransformerFactory`, `SchemaFactory` and `XMLReader` each need configuring:
    `disallow-doctype-decl`, or the `external-general-entities`,
    `external-parameter-entities` and `load-external-dtd` features off, plus
    `ACCESS_EXTERNAL_DTD` and `ACCESS_EXTERNAL_SCHEMA` set to empty.
  - **.NET:** `XmlReaderSettings.DtdProcessing = Prohibit` and `XmlResolver = null`; on old
    framework versions `XmlDocument` and `XmlTextReader` resolve by default.
  - **libxml2 and bindings (PHP, Ruby's Nokogiri, Node):** the `NOENT` option *enables*
    entity substitution, and `DTDLOAD` loads external DTDs. Neither should be set.
- **XInclude processing enabled** on untrusted input: `xi:include` reads files and URLs.
- **Schemas, DTDs or stylesheets fetched from a location the document names**
  (`xsi:schemaLocation`, `<!DOCTYPE … SYSTEM>`, `<?xml-stylesheet?>`).

### Resource exhaustion

- **Entity expansion:** nested internal entities ("billion laughs") or one large entity
  referenced many times expand a small document into gigabytes. Refusing DTDs removes it;
  otherwise rely on the parser's expansion limits and do not raise them (`huge_tree=True` in
  lxml removes libxml2's).
- **No limit on document size, depth or attribute count** before parsing, and whole-document
  parsing of unbounded input.
- **Compressed input** (Office documents, `.svgz`) expanded without a cap.
- **Schema validation with untrusted schemas,** and regular-expression facets with
  catastrophic backtracking.

### XSLT

- **Running a stylesheet that is not trusted.** XSLT is a programming language: `document()`
  reads files and URLs, `xsl:include` and `xsl:import` fetch more code, and processors offer
  extension functions and scripting that reach the host (Xalan and Saxon extensions,
  `msxsl:script`, `php:function`, `exsl:document` writing files).
- **Untrusted input to a trusted stylesheet** that uses `document()` on a value from the
  input, or `disable-output-escaping` on text from it.
- **Processor not restricted:** secure processing off, extension functions enabled.

### Injection

- **XPath built by concatenating input.** A quote in the value changes the query, as in SQL.
  Use variables or parameterised evaluation.
- **XML built by string formatting.** A value containing `<`, `&` or a quote adds or changes
  elements and attributes: a duplicated `<role>` element, an injected attribute. Use a
  serialiser.
- **Output escaping left to the consumer:** text from XML placed into HTML, SQL or a shell
  command is still untrusted after parsing.

### SVG and documents shown to users

- **SVG from users served from the application's origin.** SVG can contain `<script>`, event
  attributes, `<foreignObject>` with HTML, and external references. Sanitise it, or serve it
  from a separate origin with a restrictive content type and policy; an `<img>` reference
  does not run its script, an inline or directly opened SVG does.
- **XML rendered in a browser with a stylesheet** the uploader chose.

### Signed and authenticated XML

- **XML Signature and SAML handling written by hand,** or a library used so that the signed
  element is not the one that is then read (signature wrapping), comments splitting text
  nodes in identifiers, or signature validation that is optional. These need a specialist
  review: report the concern, don't sign it off.

### Configuration

- **Secrets in XML configuration:** passwords in Maven `settings.xml` or a POM, connection
  strings in `web.config` and `app.config`, keys in Android resources, credentials in CI job
  definitions.
- **Security-relevant settings changed:** in an Android manifest `android:exported="true"`,
  `android:debuggable`, `android:allowBackup`, `android:usesCleartextTraffic` and new
  permissions; in `web.config` custom errors off, debug on, request validation off; in Spring
  or servlet configuration a filter or constraint removed.
- **Build files that fetch over `http://`** or from an unpinned source (Maven repositories,
  plugin versions).

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Where XML is parsed | `git grep -nE 'etree\|minidom\|pulldom\|xml\.sax\|expat\|DocumentBuilderFactory\|SAXParserFactory\|XMLInputFactory\|TransformerFactory\|SchemaFactory\|XmlReader\|XmlDocument\|XDocument\|libxml\|xml2js\|fast-xml-parser\|DOMParser\|Nokogiri\|REXML\|simplexml\|DOMDocument'` | Each construction site needs its settings read. |
| How those parsers are configured | `git grep -nE 'resolve_entities\|load_dtd\|no_network\|huge_tree\|defusedxml\|disallow-doctype-decl\|external-(general\|parameter)-entities\|load-external-dtd\|FEATURE_SECURE_PROCESSING\|ACCESS_EXTERNAL\|DtdProcessing\|XmlResolver\|NOENT\|DTDLOAD\|XInclude\|xinclude'` | A parser with no configuration near it is the thing to look at. |
| DTDs, entities and includes in documents | `git grep -nE '<!DOCTYPE\|<!ENTITY\|xi:include\|xml-stylesheet' -- '*.xml' '*.svg' '*.xsl' '*.xslt'` | |
| XSLT that reaches outside | `git grep -nE 'document\(\|xsl:(include\|import)\|disable-output-escaping\|msxsl:script\|php:function\|extension-element-prefixes' -- '*.xsl' '*.xslt'` | |
| Script in SVG | `git grep -nE '<script\|\son[a-z]+=\|foreignObject\|href="(https?:\|javascript:)' -- '*.svg'` | |
| Python security lint | `bandit -q -r <package>` | Reports standard-library XML parsers used on possibly untrusted data (the B3xx and B4xx XML checks). |
| Secrets | `gitleaks detect --no-git --source .` | |
| Does this parser expand entities | the harmless internal-entity probe in `TOOLING.md` | Never probe with entities that read real files or call real hosts outside a disposable environment. |

## What this review does not establish

It reads documents, configuration and parser set-up. It does not attack a running service,
so an external-entity finding is rated from the parser's settings and version, and marked
`to verify` where those could not be confirmed. It does not cover XML Signature, XML
Encryption or SAML correctness beyond flagging them for specialist review.

# XML tooling

XML is tool-first: run these before reading. Follow `SKILL.md` step 4: run what the project
already has, don't install into it, and treat output as leads to confirm. Record in the report
which tool and version ran, and what could not be checked. With nothing installed,
`python3 scripts/check_formats.py -l xml -p <path> -r` checks well-formedness with Python's
`expat`; it does not expand entities, and reports a document that declares any as `unchecked`.

Validate with the network off where the tool allows it (`--nonet`): a document under review
can name a DTD or schema on a remote host, and fetching it both leaks that the file was opened
and trusts whatever the host returns.

## Find what the project uses

```bash
git ls-files | grep -iE '\.(xsd|dtd|rng|rnc|sch|xsl|xslt)$' | head -40             # schemas and transforms
git grep -nE 'xsi:(schemaLocation|noNamespaceSchemaLocation)|<!DOCTYPE' -- '*.xml' | head -20
ls pom.xml build.xml ivy.xml AndroidManifest.xml web.xml .xmllintrc 2>/dev/null
git grep -nE 'etree|minidom|pulldom|xml\.sax|expat|defusedxml|DocumentBuilderFactory|SAXParserFactory|XMLInputFactory|TransformerFactory|XmlReader|XmlDocument|XDocument|libxml|xml2js|fast-xml-parser|DOMParser|quick_xml|roxmltree|Nokogiri|REXML' | head -40   # where XML is parsed
git grep -nE 'resolve_entities|load_dtd|no_network|huge_tree|disallow-doctype-decl|external-(general|parameter)-entities|FEATURE_SECURE_PROCESSING|DtdProcessing|XmlResolver|LIBXML_NOENT|noent|ACCESS_EXTERNAL' | head -40   # how those parsers are configured
```

The last two are rough nets: a parser with no configuration line near it is the thing to read.

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Well-formedness | `xmllint --noout --nonet file.xml` | From libxml2. No output means well-formed. Without it: `python3 -c "import sys, xml.dom.minidom as m; m.parse(sys.argv[1])" file.xml`. |
| Validate against an XSD | `xmllint --noout --nonet --schema schema.xsd file.xml` | libxml2 implements XSD 1.0. For XSD 1.1 use Xerces or Saxon EE. |
| Validate against a DTD or RELAX NG | `xmllint --noout --nonet --dtdvalid file.dtd file.xml`, `xmllint --noout --relaxng schema.rng file.xml` | `jing schema.rnc file.xml` for the RELAX NG compact syntax. |
| Is the schema itself valid | `xmllint --noout --nonet --schema schema.xsd /dev/null` | Reports schema compilation errors before the (expected) document error. |
| Evaluate an XPath | `xmllint --xpath "//*[local-name()='entry']" file.xml` | XPath 1.0. `local-name()` sidesteps namespaces for a quick look; real code should bind the namespace. |
| Canonical form for comparing two documents | `xmllint --c14n a.xml > a.c14n` then `diff` | Removes differences in attribute order and quoting. Whitespace between elements still differs. |
| Run a transform | `xsltproc --nonet style.xsl input.xml` | XSLT 1.0 only. For 2.0 and 3.0: `java -jar saxon-he.jar -s:input.xml -xsl:style.xsl`. |
| Encoding as stored | `file -i file.xml`, `head -c 64 file.xml \| xxd` | Compare with the `encoding` in the declaration. `EF BB BF` at the start is a UTF-8 byte-order mark. |
| Maven | `mvn -q -o validate`, `mvn -o help:effective-pom`, `mvn -o dependency:tree` | `-o` keeps Maven offline. The effective POM shows what inheritance and profiles resolve to. |
| Android manifests and resources | `./gradlew lint` | Reports exported components, missing permissions, unused resources. |
| SVG | `npx svgo --dry-run file.svg` plus a search for `<script`, `on*=` and external `href` | SVG is XML that browsers execute: see `SECURITY.md`. |
| Tests | the project's suite for the code that reads or writes the document | A fixture that still parses is weak evidence; look for assertions on the values read. |

## Reading the output

- **A well-formed document is not a valid one,** and a valid one is not a correct one. Each
  check answers a narrower question than the next: syntax, then structure and types, then
  whether the values mean what the consumer needs.
- **Validation needs the right schema.** A document that names no schema, or names one by a
  URL that the tool cannot reach offline, may be reported as valid because nothing was checked.
  Confirm which schema was applied.
- **libxml2's messages give line numbers for where the parser noticed the problem,** which can
  be well after the cause, for example an unclosed element reported at the end of the file.
- **XSD 1.0 and 1.1 differ** (`xs:assert`, `xs:alternative`, open content): an error from
  `xmllint` on a 1.1 schema is a tool limit, not a schema defect.

## Reproducing a finding

Whether a parser expands entities, using a harmless internal entity and no file or network
access:

```python
import xml.etree.ElementTree as ET

DOC = '<?xml version="1.0"?><!DOCTYPE r [<!ENTITY e "expanded">]><r>&e;</r>'
print(ET.fromstring(DOC).text)        # "expanded": the standard library expands internal entities
```

Run the same document through the parser and settings the code under review uses. If the text
comes back as `expanded`, the parser processes the DTD, and the external-entity and expansion
questions in `SECURITY.md` apply. Do not test with entities that read real files or call real
hosts outside a disposable environment.

A namespace finding, in three lines:

```python
import xml.etree.ElementTree as ET

root = ET.fromstring('<feed xmlns="http://www.w3.org/2005/Atom"><entry/></feed>')
print(len(root.findall("entry")))                                               # 0
print(len(root.findall("a:entry", {"a": "http://www.w3.org/2005/Atom"})))        # 1
```

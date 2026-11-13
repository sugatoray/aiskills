# XML fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change,
adapted to the project's parser, language and conventions. Parser defaults differ by library
and version: check the version in use before suggesting a setting.

## Parse untrusted XML with DTDs and external entities off

```python
# Before: lxml resolves entities by default, and older releases also load external ones
from lxml import etree

root = etree.fromstring(payload)
```

```python
# After: no entity resolution, no DTD loading, no network
from lxml import etree

parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False, huge_tree=False)
root = etree.fromstring(payload, parser)
```

For the standard library parsers, `defusedxml` is the usual choice
(`from defusedxml.ElementTree import fromstring`); it rejects DTDs, entity declarations and
external references.

```java
// Before
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
Document doc = dbf.newDocumentBuilder().parse(input);
```

```java
// After: refusing DOCTYPE declarations removes entity attacks at the root
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);
Document doc = dbf.newDocumentBuilder().parse(input);
```

```csharp
// After (.NET): prohibit DTDs and remove the resolver
var settings = new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null };
using var reader = XmlReader.Create(stream, settings);
```

## Build XML with a serialiser, not string formatting

```python
# Before: breaks, or injects elements, when name contains & < or "
xml = f'<user name="{name}"><note>{note}</note></user>'
```

```python
# After
import xml.etree.ElementTree as ET

user = ET.Element("user", {"name": name})
ET.SubElement(user, "note").text = note
xml = ET.tostring(user, encoding="unicode")
```

## Namespace-aware lookups

```python
# Before: finds nothing, silently, because the elements are in the Atom namespace
import xml.etree.ElementTree as ET

root = ET.fromstring(feed)
titles = [e.text for e in root.findall("entry/title")]
```

```python
# After: match on the namespace URI, through a prefix map of your own
NS = {"atom": "http://www.w3.org/2005/Atom"}
titles = [e.text for e in root.findall("atom:entry/atom:title", NS)]
```

## Handle the missing element

```python
# Before: AttributeError when <timeout> is absent
timeout = int(root.find("timeout").text)
```

```python
# After: absent and empty are both handled, and the default is explicit
text = root.findtext("timeout")
timeout = int(text.strip()) if text and text.strip() else DEFAULT_TIMEOUT
```

## Parameterised XPath

```python
# Before: name = "' or '1'='1" selects every user
user = tree.xpath(f"//user[@name='{name}']")
```

```python
# After (lxml): the value is passed as a variable, not spliced into the expression
user = tree.xpath("//user[@name=$name]", name=name)
```

## Stream large documents

```python
# Before: the whole file is held in memory as a tree
import xml.etree.ElementTree as ET

for record in ET.parse(path).getroot().iter("record"):
    handle(record)
```

```python
# After: one record at a time, each released once handled
import xml.etree.ElementTree as ET

for _event, elem in ET.iterparse(path, events=("end",)):
    if elem.tag == "record":
        handle(elem)
        elem.clear()
```

## Escape reserved characters in the document

```xml
<!-- Before: not well-formed, the parser stops at the bare & -->
<link href="https://example.com/search?q=xml&page=2">R&D <notes></link>
```

```xml
<!-- After -->
<link href="https://example.com/search?q=xml&amp;page=2">R&amp;D &lt;notes&gt;</link>
```

## Numeric references instead of HTML entity names

```xml
<!-- Before: &nbsp; is not defined in XML without a DTD -->
<title>Price:&nbsp;10&euro;</title>
```

```xml
<!-- After -->
<title>Price:&#160;10&#8364;</title>
```

## Compatible schema changes

```xml
<!-- Before: every existing document is now invalid -->
<xs:element name="order">
  <xs:complexType>
    <xs:sequence>
      <xs:element name="id" type="xs:string"/>
      <xs:element name="currency" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
</xs:element>
```

```xml
<!-- After: the new element is optional, so old documents still validate -->
<xs:element name="order">
  <xs:complexType>
    <xs:sequence>
      <xs:element name="id" type="xs:string"/>
      <xs:element name="currency" type="xs:string" minOccurs="0"/>
    </xs:sequence>
  </xs:complexType>
</xs:element>
```

Make it required in a later version, once every writer sends it.

## Keys instead of repeated document scans in XSLT

```xml
<!-- Before: one scan of every customer for each order -->
<xsl:template match="order">
  <xsl:value-of select="//customer[@id = current()/@customer]/name"/>
</xsl:template>
```

```xml
<!-- After -->
<xsl:key name="customer-by-id" match="customer" use="@id"/>

<xsl:template match="order">
  <xsl:value-of select="key('customer-by-id', @customer)/name"/>
</xsl:template>
```

## Pin versions in a Maven POM

```xml
<!-- Before: a range and an unpinned plugin make the build unrepeatable -->
<dependency>
  <groupId>org.example</groupId>
  <artifactId>client</artifactId>
  <version>[1.0,)</version>
</dependency>
```

```xml
<!-- After -->
<dependency>
  <groupId>org.example</groupId>
  <artifactId>client</artifactId>
  <version>1.4.2</version>
</dependency>
```

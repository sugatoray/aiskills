# XML review wisdom

Read this before forming findings on XML, in a full review and in a security-only one.
**Constraints** are limits the review must stay within. **Traps** are things in the language
that mislead a reader. **Ditches** are the ways a review of this language goes off the road.
**Wisdom** is the judgement that keeps it on.

## Constraints

- **Run the tools first.** Well-formedness, schema validity and formatting are for
  `xmllint` or the project's validator to decide, not for reading. Spend the review on what
  no tool judges: meaning, compatibility, parser configuration, secrets.
- **The consumer defines correctness.** XML that validates but that the consuming tool or
  partner reads differently is wrong. Find the consumer before judging structure.
- **An exchanged format is an API.** Element and attribute names, namespaces, order and
  optionality are a contract with systems the diff does not show.
- **Parser behaviour depends on library and version.** State which you checked; never carry
  one library's default to another.
- **Validate with the network off,** and never fetch a DTD, schema or stylesheet that a
  document under review points to.
- **XML 1.0 is what almost everything implements.** XSD 1.1, XSLT 2.0 and 3.0 and XPath 2.0
  need processors that many environments do not have.

## Traps

- **The namespace URI is the name; the prefix is not.** `<a:item>` and `<b:item>` are the
  same element when both prefixes map to one URI, and different when they don't.
- **A default namespace applies to elements, never to attributes.**
- **An unprefixed name in XPath 1.0 means "in no namespace",** so `//entry` finds nothing in
  a document with a default namespace, and reports no error.
- **Well-formed, valid and correct are three different things.**
- **A parser must stop at the first well-formedness error.** There is no partial result to
  fall back on, unlike HTML.
- **Only five entities are predefined.** `&nbsp;` is an error without a DTD.
- **Whitespace between elements is data** unless a schema or the consumer says otherwise;
  pretty-printing mixed content changes it.
- **`<a/>`, `<a></a>` and a missing `<a>` are not the same** to most consumers: empty against
  absent.
- **Attribute order is not significant and not preserved;** element order usually is, and
  `xs:sequence` enforces it.
- **Comments and processing instructions may be dropped** by any tool in the chain.
- **In libxml2, the option named `NOENT` turns entity substitution on.**
- **Text can arrive in several pieces:** adjacent text nodes, CDATA sections and entity
  references are separate nodes in some APIs.
- **The encoding declaration can lie.** The bytes decide.
- **A schema location is a hint, not an instruction;** a validator may ignore it and report
  "valid" having checked nothing.

## Ditches

- **Reading for indentation and attribute order** that a formatter owns.
- **Checking well-formedness by eye** instead of running a parser.
- **Reporting "validates" without saying against which schema.**
- **Assuming a parser is safe, or unsafe, by reputation.** Read its settings and version.
- **Reviewing the document and not the code that reads it,** or the reverse.
- **Treating a configuration file as data.** A changed bean, dependency, permission or target
  is a behaviour change and is reviewed as code.
- **Proposing JSON or YAML instead** in a review of an XML change.
- **Missing the compatibility break** in a schema change that looks like a tidy-up.

## Wisdom

- **Refuse DTDs on anything that crosses a trust boundary.** One setting removes external
  entities and expansion attacks together.
- **Parse with a parser, write with a serialiser.** String handling of XML is where both the
  bugs and the injections come from.
- **Bind namespaces explicitly in code and XPath,** by URI.
- **Make schema changes additive and optional first;** tighten later, when every writer has
  caught up.
- **Validate at the boundary, against a schema you control and ship,** not one fetched at
  run time.
- **Stream what can be large.**
- **Keep secrets out of configuration files;** reference the environment or a secret store.
- **Reproduce with a three-line document before rating.** Namespace and entity behaviour is
  quicker to show than to argue.
- **Say what you did not check:** the parser version, the schema used, consumers not found.

#!/usr/bin/env python3
"""Render a validated graph as one offline HTML document."""
import argparse
import html
import json
from pathlib import Path
from network_flow import normalize_graph

ROOT = Path(__file__).resolve().parents[1]


def render(graph):
    graph = normalize_graph(graph)
    data = json.dumps(graph, ensure_ascii=False).replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e')
    template = (ROOT / 'assets/template.html').read_text(encoding='utf-8')
    fragment = (template.replace('__STYLE__', (ROOT / 'assets/runtime/style.css').read_text(encoding='utf-8'))
                .replace('__SCRIPT__', (ROOT / 'assets/runtime/renderer.js').read_text(encoding='utf-8'))
                .replace('__GRAPH_DATA__', data))
    return ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="color-scheme" content="dark"><title>' + html.escape(graph['title']) + '</title>'
            '<style>body{margin:0;padding:24px;background:#060809}@media(max-width:700px){body{padding:8px}}</style>'
            '</head><body>' + fragment + '</body></html>\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('graph', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--theme', choices=['dark-grid'], default='dark-grid')
    parser.add_argument('--routing', choices=['orthogonal'], default='orthogonal')
    parser.add_argument('--mode', choices=['simulated'], default='simulated')
    parser.add_argument('--scenarios', help='Comma-separated scenario IDs; all is always included')
    args = parser.parse_args()
    try:
        graph = normalize_graph(json.loads(args.graph.read_text(encoding='utf-8')))
        if args.scenarios:
            requested = args.scenarios.split(',')
            if any(s not in graph['scenarios'] for s in requested):
                raise ValueError('unknown scenario requested')
            graph['scenarios'] = {s: graph['scenarios'][s] for s in dict.fromkeys(requested + ['all'])}
        if args.output.suffix.lower() != '.html':
            raise ValueError('output must end in .html')
        output = render(graph)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output, encoding='utf-8')
    except (OSError, ValueError) as error:
        parser.error(str(error))
    print(args.output.resolve())


if __name__ == '__main__':
    main()

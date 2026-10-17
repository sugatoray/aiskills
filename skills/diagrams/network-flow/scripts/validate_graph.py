#!/usr/bin/env python3
"""Validate a network-flow graph without rendering or downloading anything."""
import argparse
import json
from pathlib import Path
from network_flow import normalize_graph

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('graph', type=Path)
args = parser.parse_args()
try:
    graph = normalize_graph(json.loads(args.graph.read_text(encoding='utf-8')))
except (OSError, ValueError) as error:
    parser.error(str(error))
print(f"Valid: {len(graph['nodes'])} nodes, {len(graph['edges'])} edges, {len(graph['scenarios'])} scenarios")

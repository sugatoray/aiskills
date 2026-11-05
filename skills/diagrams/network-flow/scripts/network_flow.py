"""Validate and normalize the offline network-flow graph contract (stdlib only)."""
from copy import deepcopy
import re

IDENTIFIER = re.compile(r"^[a-z][a-z0-9-]{0,63}$")
COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def normalize_graph(value):
    if not isinstance(value, dict):
        raise ValueError('graph must be an object')
    graph = deepcopy(value)
    def text(value, label):
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f'{label} must be a nonempty string')
        return value
    def identifier(value, label):
        if not isinstance(value, str) or not IDENTIFIER.fullmatch(value):
            raise ValueError(f'{label} must be a lowercase hyphenated identifier')
        return value
    text(graph.get('title'), 'title')
    for field in ('subtitle', 'eyebrow'):
        if field in graph and not isinstance(graph[field], str):
            raise ValueError(f'{field} must be a string')
    graph.setdefault('colors', {'flow': '#53abff'})
    colors = graph['colors']
    if not isinstance(colors, dict) or not colors:
        raise ValueError('colors must be a nonempty map')
    for key, color in colors.items():
        identifier(key, 'color key')
        if not isinstance(color, str) or not COLOR.fullmatch(color):
            raise ValueError('colors must contain six-digit hex values')
    first_color = next(iter(colors))
    nodes, edges = graph.get('nodes'), graph.get('edges')
    if not isinstance(nodes, list) or not 1 <= len(nodes) <= 24:
        raise ValueError('nodes must contain between 1 and 24 entries; split larger systems')
    if not isinstance(edges, list):
        raise ValueError('edges must be an array')
    node_ids, edge_ids = set(), set()
    for node in nodes:
        if not isinstance(node, dict):
            raise ValueError('each node must be an object')
        node_id = identifier(node.get('id'), 'node id')
        if node_id in node_ids:
            raise ValueError(f'duplicate node id: {node_id}')
        node_ids.add(node_id)
        text(node.get('name'), 'node name')
        for field, default in [('kind', 'Service'), ('sub', ''), ('detail', node['name'])]:
            node.setdefault(field, default)
            if not isinstance(node[field], str):
                raise ValueError(f'node {field} must be a string')
        node.setdefault('color', first_color)
        if not isinstance(node['color'], str) or node['color'] not in colors:
            raise ValueError('node color must reference colors')
    for edge in edges:
        if not isinstance(edge, dict):
            raise ValueError('each edge must be an object')
        edge_id = identifier(edge.get('id'), 'edge id')
        if edge_id in edge_ids:
            raise ValueError(f'duplicate edge id: {edge_id}')
        edge_ids.add(edge_id)
        if (not isinstance(edge.get('from'), str) or not isinstance(edge.get('to'), str)
            or edge['from'] not in node_ids or edge['to'] not in node_ids):
            raise ValueError(f'dangling edge: {edge_id}')
        if edge['from'] == edge['to']:
            raise ValueError('self loops are unsupported; model a separate state')
        edge.setdefault('kind', first_color)
        if not isinstance(edge['kind'], str) or edge['kind'] not in colors:
            raise ValueError('edge kind must reference colors')
    graph.setdefault('scenarios', {})
    if not isinstance(graph['scenarios'], dict):
        raise ValueError('scenarios must be a map')
    for scenario_id, scenario in graph['scenarios'].items():
        identifier(scenario_id, 'scenario id')
        if not isinstance(scenario, dict):
            raise ValueError('scenario must be an object')
        text(scenario.get('label'), 'scenario label')
        scope, steps = scenario.get('scope'), scenario.get('steps', [])
        if not isinstance(scope, list) or any(not isinstance(e, str) or e not in edge_ids for e in scope):
            raise ValueError('scenario scope must reference known edges')
        if len(scope) != len(set(scope)):
            raise ValueError('scenario scope must not repeat edges')
        if not isinstance(steps, list):
            raise ValueError('scenario steps must be an array')
        for step in steps:
            if not isinstance(step, dict) or not isinstance(step.get('edge'), str) or step['edge'] not in scope:
                raise ValueError('scenario step edge must be in its scope')
            text(step.get('text'), 'step text')
        scenario['steps'] = steps
        if scenario_id != 'all' and not steps:
            raise ValueError('named scenarios require at least one step')
    graph['scenarios']['all'] = {'label': 'All', 'scope': [e['id'] for e in edges], 'steps': []}
    graph.setdefault('legend', {})
    if not isinstance(graph['legend'], dict):
        raise ValueError('legend must be a map')
    for key, label in graph['legend'].items():
        if key not in colors:
            raise ValueError('legend key must reference colors')
        text(label, 'legend label')
    if 'footer' in graph:
        if not isinstance(graph['footer'], dict) or any(not isinstance(v, str) for v in graph['footer'].values()):
            raise ValueError('footer must contain strings')
    layouts = graph.get('layouts', {})
    if not isinstance(layouts, dict):
        raise ValueError('layouts must be a map')
    for key, positions in layouts.items():
        limit = {'wide': 4, 'medium': 3, 'narrow': 2}.get(key)
        if limit is None or not isinstance(positions, dict) or set(positions) != node_ids:
            raise ValueError('each layout must name every node and use wide, medium, or narrow')
        occupied = set()
        for position in positions.values():
            if (not isinstance(position, list) or len(position) != 2
                or any(type(v) is not int or v < 0 for v in position)
                or position[0] >= limit or position[1] >= 24):
                raise ValueError('layout positions must be bounded nonnegative [column, row] integers')
            cell = tuple(position)
            if cell in occupied:
                raise ValueError('layout places multiple nodes in one cell')
            occupied.add(cell)
    return graph

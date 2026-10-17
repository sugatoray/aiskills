import copy
import json
from pathlib import Path
import sys
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from network_flow import normalize_graph
from render import render


def minimal():
    return {'title': 'Request', 'nodes': [{'id': 'client', 'name': 'Client'}, {'id': 'api', 'name': 'API'}],
            'edges': [{'id': 'request', 'from': 'client', 'to': 'api'}]}


class GraphTests(unittest.TestCase):
    def test_defaults_do_not_modify_input(self):
        value = minimal()
        before = copy.deepcopy(value)
        graph = normalize_graph(value)
        self.assertEqual(value, before)
        self.assertEqual(graph['scenarios']['all']['scope'], ['request'])
        self.assertEqual(graph['nodes'][0]['color'], 'flow')

    def test_dangling_endpoint(self):
        value = minimal(); value['edges'][0]['to'] = 'missing'
        with self.assertRaisesRegex(ValueError, 'dangling'): normalize_graph(value)

    def test_duplicate_node(self):
        value = minimal(); value['nodes'].append(value['nodes'][0])
        with self.assertRaisesRegex(ValueError, 'duplicate'): normalize_graph(value)

    def test_duplicate_edge(self):
        value = minimal(); value['edges'].append(value['edges'][0])
        with self.assertRaisesRegex(ValueError, 'duplicate'): normalize_graph(value)

    def test_self_loop(self):
        value = minimal(); value['edges'][0]['to'] = 'client'
        with self.assertRaisesRegex(ValueError, 'self loops'): normalize_graph(value)

    def test_scope_and_step_must_agree(self):
        value = minimal(); value['scenarios'] = {'read': {'label': 'Read', 'scope': [], 'steps': [{'edge': 'request', 'text': 'Request'}]}}
        with self.assertRaisesRegex(ValueError, 'in its scope'): normalize_graph(value)

    def test_unknown_scope(self):
        value = minimal(); value['scenarios'] = {'read': {'label': 'Read', 'scope': ['missing']}}
        with self.assertRaisesRegex(ValueError, 'known edges'): normalize_graph(value)

    def test_overlap_and_incomplete_layout(self):
        value = minimal(); value['layouts'] = {'narrow': {'client': [0, 0], 'api': [0, 0]}}
        with self.assertRaisesRegex(ValueError, 'one cell'): normalize_graph(value)
        del value['layouts']['narrow']['api']
        with self.assertRaisesRegex(ValueError, 'every node'): normalize_graph(value)

    def test_layout_column_limit(self):
        value = minimal(); value['layouts'] = {'narrow': {'client': [0, 0], 'api': [2, 0]}}
        with self.assertRaisesRegex(ValueError, 'bounded'): normalize_graph(value)

    def test_css_values_are_restricted(self):
        value = minimal(); value['colors'] = {'flow': 'red;background:url(https://example.org)'}
        with self.assertRaisesRegex(ValueError, 'six-digit'): normalize_graph(value)

    def test_script_breakout_is_serialized_as_text(self):
        value = minimal(); payload = '</script><script>alert(1)</script>'
        value['title'] = payload; value['nodes'][0]['name'] = payload
        result = render(value)
        self.assertNotIn(payload, result)
        data = result.split('id="network-flow-data">')[1].split('</script>')[0]
        self.assertEqual(json.loads(data)['nodes'][0]['name'], payload)
        self.assertNotIn('__GRAPH_DATA__', result)
        self.assertNotIn('<script src=', result)

    def test_unsupported_mode_fails_without_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'out.html'
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/render.py'),
                                     str(ROOT / 'examples/rag.json'), '--mode', 'live',
                                     '--output', str(output)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('invalid choice', result.stderr)
            self.assertFalse(output.exists())

    def test_malformed_json_values_raise_validation_errors(self):
        for field in ['from', 'kind']:
            value = minimal(); value['edges'][0][field] = []
            with self.assertRaises(ValueError): normalize_graph(value)
        value = minimal(); value['nodes'][0]['color'] = []
        with self.assertRaises(ValueError): normalize_graph(value)

    def test_bundled_example_is_reproducible(self):
        graph = json.loads((ROOT / 'examples/rag.json').read_text())
        result = render(graph)
        self.assertEqual(result, (ROOT / 'examples/rag.html').read_text())
        self.assertEqual(len(normalize_graph(graph)['scenarios']), 4)


if __name__ == '__main__':
    unittest.main()

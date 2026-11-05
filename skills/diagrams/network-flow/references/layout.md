# Layout and motion

The reusable runtime uses HTML card buttons above an SVG wire layer. A
ResizeObserver measures the board, selects 4/3/2-column layouts at board widths
920/620 pixels, and rebuilds geometry from card bounds. Mobile cards retain
readable labels; the diagram grows vertically instead of scaling text down.

A rectilinear visibility grid includes card ports and clearance lines around
cards. A shortest-path search adds a bend cost and rejects segments through card
interiors. Connections use horizontal and vertical SVG path segments. Wires may
cross or share corridors; intersections are not junctions. Dense parallel edges
may need hand-adjusted layouts or dedicated lanes. The bundled version does not
implement an editor, pan/zoom, rounded corners, or automatic edge bundling.

Packet stroke-dashoffset follows the actual path length at 80 SVG units/second
in All mode. Scenario mode illustrates one edge per 2.6-second step. Scenario
transitions keep card placement stable. Pausing freezes the timeline and packet
positions; replay restarts the active scenario. Reduced motion removes moving
packets while preserving topology, captions, and interactive selection.

For each generated system, check routing and label fit in a browser. Long labels
can overflow fixed card heights; shorten copy or change runtime geometry rather
than claiming the validator has verified visual fit. Keep component names concise.

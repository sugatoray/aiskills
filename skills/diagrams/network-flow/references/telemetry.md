# Simulated animation versus telemetry

The bundled renderer is simulated and offline. It has no API calls, WebSocket,
SSE adapter, credentials, or production instrumentation. A moving packet is an
explanation, not a measurement. Reject unsupported CLI mode values explicitly.

If a user separately requests real telemetry, identify the event source and
connection mapping first. Define event ID, timestamp, source node, destination
node or edge ID, trace ID, status, and optional duration. Validate events against
the graph; handle late/duplicate events, reconnects, bounded buffering, sampling,
and dropped-event reporting. Distinguish disconnected, idle, and active states.
Never invent measured throughput or successful delivery from cosmetic motion.

Keep adapters outside the bundled offline renderer until implemented and tested.
Use an authorized backend for protected sources; do not embed secrets in HTML.
Playback must still support pause, reduced motion, and a truthful status label.

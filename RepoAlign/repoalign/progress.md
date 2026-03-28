# Progress and Next Steps toward SemanticForge-Aligned Industry-Grade Project

## What is implemented today

- VS Code extension commands for workspace scan, dependency graphing, suspicious-pattern surfacing, and backend-driven similar-file lookup (see src/commands/_ and src/utils/_). Backend health checked via REST (src/utils/apiClient.ts).
- FastAPI backend routers for health, embeddings, similarity, profile index build/status, and profile similarity (python_engine/app/main.py and python_engine/app/routes/\*).
- Profile indexing writes JSON over TypeScript: regex feature extraction (imports, classes, methods, constructor injections, service calls, path keywords), sentence-transformer embeddings, cosine similarity search (python_engine/app/services/profile_builder.py, profile_indexer.py, index_loader.py, similarity_service.py).
- AI similarity uses all-MiniLM-L6-v2 with cosine, plus optional pattern-overlap heuristic (python_engine/app/services/embedder.py, similarity_service.py).
- Stale-index detection compares file mtimes vs stored mtimes (python_engine/app/services/index_status_service.py) and reports via /index-status.

## Gaps vs SemanticForge vision and proposal

- No dual static–dynamic KG: ingestion is regex-only; lacks AST/type graphs, control/data-flow edges, runtime traces, or reconciled dual graphs.
- No graph store or query planner: retrieval is embedding-only; missing neural NL→graph query planner and structured graph queries over a KG.
- No constraint/SAT layer: no SMT/type/contract checks in generation or enforcement; no solver-in-the-loop beam search.
- No incremental maintenance: rebuilds are monolithic; no O(|ΔR| log n) updates, no watcher, cache, or versioned deltas.
- Limited coverage: TypeScript-only; no multi-language analyzers, manifests, test artifacts, or runtime profiling/test hooks.
- Missing data/model ops: no eval harness (Pass@k, hallucination rates), no dataset versioning, no prompt/model versioning, no latency/error budgets.
- Tooling hygiene gaps: few tests, no CI/CD, sparse logging/metrics/traces, no benchmarking, limited configuration management, no packaging/distribution story.
- Security/infra: no auth/rate limits/CORS hardening; no secrets management; no sandboxing for dynamic runs.

## Roadmap to industry-grade, SemanticForge-aligned implementation

### Phase 0 — Hardening foundation (immediate)

- Add endpoint validation, structured error handling, structured logging, env-based config (model paths, index paths, ports), and OS-normalized paths. Introduce secrets handling (.env + vault) and safe defaults.
- Add type checks and linting (ruff/mypy for Python; eslint/tsc for extension). Pre-commit hooks for fmt+lint+types.
- Tests: unit (profile extraction, indexing, similarity), integration (REST), and VS Code command tests (vscode-test). Start CI (GitHub Actions) running fmt/lint/types/tests.
- Dependency hygiene: pin versions; cache/download sentence-transformer at startup; add reproducible env (uv/poetry + lockfile) and VSIX/package-lock integrity.
- Observability starter: basic request logging, timing metrics, and error taxonomy; output channel hygiene on the extension side.

### Phase 1 — Repository ingestion and KG construction

- Replace regex extraction with AST + type checker (ts-morph) to emit symbols, signatures, imports, call graph, module boundaries, generics. Persist normalized IR (nodes/edges + attributes).
- Add static control/data-flow edges, schema edges (types/interfaces/contracts). Store in a graph DB (Neo4j) or embedded DuckDB/SQLite edge tables with indexes.
- Add dynamic traces: test-run tracing/instrumentation to capture runtime types, value shapes, exercised paths. Reconcile static/dynamic into dual KG with conflict resolution.
- Pattern mining: mine frequent subgraphs/architectural conventions; tag nodes/edges with pattern IDs for overlap scoring and drift detection.
- Incremental maintenance: watcher → reparse changed files → localized graph diff; maintain versioned snapshots, ΔR changelog, and cache invalidation.

### Phase 2 — Semantic retrieval and query planning

- Train/finetune graph-aware retriever over nodes/paths; add neural NL→graph query planner to emit structured graph queries.
- Hybrid retrieval: KG queries to get candidate subgraphs → dense rerank with cross-encoder; return constraints (types/contracts/patterns) plus code snippets.
- APIs: `search_graph`, `explain_contracts`, `nearest_pattern_instances`, `diff_against_pattern`, and context packs suitable for solver-guided generation.
- Add evaluation harness for retrieval quality (precision/recall@k, coverage of required symbols) on curated tasks.

### Phase 3 — Constraint-aware generation and enforcement

- Integrate SMT/solver (Z3) into generation/validation: enforce types, visibility, contracts, resource lifetimes; solver-in-the-loop beam search.
- Logical checks using control/data-flow rules; optional bounded symbolic execution for small scopes.
- VS Code flow: pre-save/commit hook runs pattern diff + solver validation; surface violations with solver-approved quick fixes; allow user-in-the-loop edits.
- Feedback logging: record accepted/rejected suggestions to improve retrieval/planner/constraints.

### Phase 4 — Evaluation, performance, and UX polish

- Benchmarks: Pass@k on repo-level tasks, schematic/logical hallucination rates, latency SLO (<3s end-to-end), ΔR update cost. Include ablations (retriever/planner/solver on/off).
- Caching/perf: model warm-start, embedding cache, graph-query cache; background prefetch; concurrency tuning.
- Observability: structured logs, metrics, traces, sampling; clear error taxonomy for retrieval vs planner vs solver vs generation.
- Security & packaging: auth/token, rate limits, CORS hardening, secrets management, sandbox for dynamic runs. Ship Docker image(s) for backend and VSIX; document resource/CPU/GPU needs.
- UX polish: progress UI, actionable errors, and clear guidance when index is stale or solver blocks a change.

### Stretch: multi-language and policy

- Extend analyzers to Python/Java/Go with language-appropriate frontends; keep IR schema unified.
- Add policy-as-code so teams can declare explicit constraints (security, performance, layering) that complement learned patterns.
- Add governance: dataset/model versioning, approvals for new models/prompts, rollback playbooks.

## Immediate next actions (pragmatic)

1. Swap regex extraction for ts-morph AST + type checker; emit structured nodes/edges JSON; persist to a graph store (start with SQLite/DuckDB edge tables).
2. Add incremental rebuild pipeline with a watcher and per-file diffs; expose `/graph-status` and `/graph-update` endpoints; cache invalidation.
3. Introduce solver-backed validation for type/arity/visibility constraints; wire into a pre-commit/save hook in VS Code.
4. Prototype NL→graph query for context fetch; log planner inputs/outputs to build a training/eval set.
5. Stand up CI: fmt/lint/types/tests and a micro-benchmark for retrieval latency/quality; publish artifacts (coverage, latency) per commit.
6. Add basic observability (request/latency metrics, error taxonomy) and secure defaults (auth/rate limits/CORS) before exposing the backend.

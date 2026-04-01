# API / Backend Service Quality Criteria

Evaluation rubric for APIs, backend services, and serverless functions (Express, FastAPI, Convex, Hono, etc.). Customize weights during `/harness setup`.

## Dimensions

### 1. API Design (Weight: High)

Are endpoints logical, consistent, and predictable? Do they follow REST/RPC conventions appropriate for the project? Is the naming clear?

| Score | Description |
|-------|-------------|
| 1 | Inconsistent naming, wrong HTTP methods, no clear resource model. |
| 2 | Some consistency but mix of conventions. Confusing endpoint structure. |
| 3 | Consistent naming and methods. Standard REST/RPC patterns. |
| 4 | Well-designed API. Good resource hierarchy, proper status codes, pagination. |
| 5 | Excellent design. Versioning, HATEOAS or equivalent, OpenAPI spec, consistent error format. |

### 2. Data Integrity (Weight: High)

Does the service handle data correctly? Are writes atomic? Are reads consistent? Are edge cases (null, empty, concurrent access) handled?

| Score | Description |
|-------|-------------|
| 1 | Data corruption possible. No validation. Race conditions. |
| 2 | Basic validation but gaps. Some edge cases cause incorrect data. |
| 3 | Validation covers common cases. Transactions used for multi-step writes. |
| 4 | Thorough validation. Atomic operations. Consistent reads. Idempotent where expected. |
| 5 | Bulletproof data handling. Optimistic concurrency, conflict resolution, audit trail. |

### 3. Error Handling (Weight: High)

Do errors return useful, structured information? Are status codes correct? Do internal errors get sanitized (no stack traces to clients)?

| Score | Description |
|-------|-------------|
| 1 | Stack traces returned to client. Wrong status codes. Unhandled exceptions crash the server. |
| 2 | Basic error handling but inconsistent format. Some info leakage. |
| 3 | Consistent error format. Correct status codes. Internal errors sanitized. |
| 4 | Structured error responses with codes, messages, and context. Good error hierarchy. |
| 5 | Excellent. Machine-readable error codes, retry hints, request IDs, graceful degradation. |

### 4. Security (Weight: High)

Authentication, authorization, input validation, rate limiting, injection prevention.

| Score | Description |
|-------|-------------|
| 1 | No auth. SQL/NoSQL injection possible. No input validation. |
| 2 | Auth exists but bypassable or inconsistent. Basic validation only. |
| 3 | Auth works correctly. Input validated. Common injection vectors blocked. |
| 4 | Proper auth with role-based access. Parameterized queries. Rate limiting. CORS configured. |
| 5 | Defense in depth. Auth + authz + audit logging + rate limiting + input sanitization + CSP. |

### 5. Performance (Weight: Medium)

Response times, query efficiency, caching strategy, connection pooling.

| Score | Description |
|-------|-------------|
| 1 | N+1 queries. No indexing. Unbounded result sets. |
| 2 | Some optimization but obvious bottlenecks. |
| 3 | Reasonable performance. Basic indexing. Paginated results. |
| 4 | Well-optimized. Proper indexing, efficient queries, caching where appropriate. |
| 5 | Highly optimized. Connection pooling, query planning, cache invalidation strategy, profiled. |

### 6. Observability (Weight: Low)

Logging, monitoring hooks, health checks, request tracing.

| Score | Description |
|-------|-------------|
| 1 | No logging. Silent failures. |
| 2 | Basic console logging. No structure. |
| 3 | Structured logging. Health check endpoint. |
| 4 | Request IDs, structured logs, metrics endpoint, health checks with dependency status. |
| 5 | Full observability. Distributed tracing, custom metrics, alerting hooks, runbooks. |

## Optional Dimensions

- **Documentation**: OpenAPI/Swagger spec, examples, changelog
- **Testing**: Integration test coverage, contract tests, load tests
- **Resilience**: Retries, circuit breakers, graceful shutdown, backpressure
- **Migration Safety**: Schema migrations, backward compatibility, rollback plan

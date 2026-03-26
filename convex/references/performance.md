# Performance & Limits

## Transaction Limits

| Resource | Limit |
|---|---|
| Query/mutation execution time | 1 second (user code only) |
| Action execution time | 10 minutes |
| Data read per transaction | 16 MiB |
| Data written per transaction | 16 MiB |
| Documents scanned per transaction | 32,000 (includes filtered-out docs) |
| Index ranges read per transaction | 4,096 |
| Documents written per transaction | 16,000 |
| Individual document size | 1 MiB |
| Function return value size | 16 MiB |

Source: [Convex limits docs](https://docs.convex.dev/production/state/limits)

## Performance Audit Workflow

1. **Gather signals**: `npx convex insights --details` or deployment health dashboard
2. **Route by problem class**:
   - High bytes/docs read → bound reads, add indexes, project columns
   - OCC conflicts → reduce read/write set, shard hot documents
   - High subscription count → consider `{ subscribe: false }` for low-freshness reads
   - Function budget exceeded → paginate, batch, split transactions

## OCC Conflicts

Convex uses optimistic concurrency control. Two transactions touching overlapping data cause one to retry.

**Common causes:**
- Hot documents (global counters, shared settings)
- Broad read sets from table scans (creates false conflicts)
- Fan-out from triggers doing heavy work in the same transaction
- Write-then-read chains under load

**Fixes (priority order):**
1. Narrow read sets with indexes (`.withIndex()` instead of `.filter()`)
2. Skip no-op writes (check before writing)
3. Shard hot documents (split counters, per-user/per-shard aggregation)
4. Move trigger work to scheduled functions
5. Use `ctx.db.get(id)` instead of `.query().filter()` for single-doc reads

## Subscription Cost

Every `useQuery()` / cRPC subscription holds an open WebSocket.

**Reduce cost:**
- Use `{ subscribe: false }` for data that doesn't need real-time updates
- Don't subscribe to paginated queries you don't need live
- Remove `Date.now()` from query args (forces new subscription every call)
- Consider point-in-time reads for high-read, low-write flows

## Migration Safety

**Safe changes (zero-downtime):**
- Adding new optional fields
- Adding new tables
- Adding new indexes
- Adding new functions

**Breaking changes (need 3-deploy workflow):**
1. Deploy code that handles both old and new format (widen)
2. Run migration to backfill data
3. Deploy code that only handles new format (narrow)

**Edge case:** `undefined !== false` for optional booleans — a compound index on `(status, createdAt)` won't match documents where `status` is `undefined` if you query `eq("status", false)`.

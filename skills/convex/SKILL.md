---
name: convex
description: Build full-stack TypeScript applications with Convex - a reactive backend-as-a-service with real-time database, serverless functions, and automatic caching. Use when working with Convex projects, writing queries/mutations/actions, defining schemas, using the Convex CLI, or integrating Convex with React/Next.js/Node.js applications.
---

# Convex Development Skill

Convex is a reactive backend platform with TypeScript-first serverless functions, a real-time document database, and automatic caching.

## Project Structure

```
my-app/
├── convex/                    # Backend code (required)
│   ├── _generated/            # Auto-generated (don't edit)
│   │   ├── api.d.ts           # Type-safe API references
│   │   ├── dataModel.d.ts     # Database types from schema
│   │   └── server.d.ts        # Function builders
│   ├── schema.ts              # Database schema definition
│   ├── [feature].ts           # Functions grouped by feature
│   └── convex.config.ts       # Component configuration (optional)
├── .env.local                 # CONVEX_URL for dev deployment
└── package.json
```

## CLI Commands

```bash
# Development
npx convex dev                 # Start dev server (syncs functions, generates types)
npx convex dev --once          # Push once without watching

# Production  
npx convex deploy              # Deploy to production
npx convex deploy --cmd 'npm run build'  # Deploy with build command

# Database
npx convex import --table <name> <file.jsonl>  # Import data
npx convex export --path <dir>                  # Export backup

# Utilities
npx convex run <path:function> '{"arg": "value"}'  # Run function
npx convex run --component <name> <path:function>  # Run component function
npx convex env set <KEY> <value>                   # Set env variable
npx convex logs                                    # Tail logs
npx convex login                                   # Authenticate
```

## Schema Definition

Define schema in `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    metadata: v.optional(v.object({
      avatar: v.optional(v.string()),
      bio: v.optional(v.string()),
    })),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  messages: defineTable({
    userId: v.id("users"),
    content: v.string(),
    channelId: v.id("channels"),
  })
    .index("by_channel", ["channelId"])
    .index("by_user_channel", ["userId", "channelId"]),
});
```

### Validators Reference

```typescript
v.string()              // string
v.number()              // number (float64)
v.int64()               // 64-bit integer
v.boolean()             // boolean
v.null()                // null
v.id("tableName")       // Document ID reference
v.array(v.string())     // Array
v.object({ ... })       // Object with specific shape
v.optional(v.string())  // Optional field
v.union(v.literal("a"), v.literal("b"))  // Union type
v.any()                 // Any Convex value
v.bytes()               // Binary data (ArrayBuffer)
```

## Functions

### Queries (Read-only, Reactive, Cached)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { channelId: v.id("channels") },
  returns: v.array(v.object({
    _id: v.id("messages"),
    content: v.string(),
    author: v.string(),
  })),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(50);
    
    return Promise.all(messages.map(async (msg) => {
      const user = await ctx.db.get(msg.userId);
      return { _id: msg._id, content: msg.content, author: user?.name ?? "Unknown" };
    }));
  },
});
```

### Mutations (Read/Write, Transactional)

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
  args: { 
    channelId: v.id("channels"),
    content: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("messages", {
      userId: user._id,
      channelId: args.channelId,
      content: args.content,
    });
  },
});
```

### Actions (Side Effects, External APIs)

```typescript
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const generateSummary = action({
  args: { documentId: v.id("documents") },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Read data via query
    const doc = await ctx.runQuery(internal.documents.get, { id: args.documentId });
    
    // Call external API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ /* ... */ }),
    });
    const result = await response.json();
    
    // Write data via mutation
    await ctx.runMutation(internal.documents.updateSummary, {
      id: args.documentId,
      summary: result.choices[0].message.content,
    });
    
    return result.choices[0].message.content;
  },
});
```

### Internal Functions

```typescript
import { internalQuery, internalMutation, internalAction } from "./_generated/server";

// Only callable from other Convex functions, not from clients
export const adminGetUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
```

## Database Operations

```typescript
// Insert
const id = await ctx.db.insert("messages", { content: "Hello", userId });

// Get by ID (returns null if not found)
const doc = await ctx.db.get(id);

// Update (partial)
await ctx.db.patch(id, { content: "Updated" });

// Replace (full document)
await ctx.db.replace(id, { content: "New", userId, channelId });

// Delete
await ctx.db.delete(id);

// Query with index
const results = await ctx.db
  .query("messages")
  .withIndex("by_channel", (q) => 
    q.eq("channelId", channelId)
     .gt("_creationTime", since)
  )
  .order("desc")
  .take(100);

// Get unique result
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", email))
  .unique();  // Returns null or document, throws if multiple
```

## React Integration

```tsx
import { ConvexProvider, ConvexReactClient, useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

// Setup (main.tsx or _app.tsx)
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
<ConvexProvider client={convex}><App /></ConvexProvider>

// In components
function Chat({ channelId }: { channelId: Id<"channels"> }) {
  // Reactive query - auto-updates when data changes
  const messages = useQuery(api.messages.list, { channelId });
  
  // Mutation
  const sendMessage = useMutation(api.messages.send);
  
  // Action
  const generateSummary = useAction(api.ai.generateSummary);

  if (messages === undefined) return <Loading />;
  
  return (
    <div>
      {messages.map(m => <Message key={m._id} {...m} />)}
      <button onClick={() => sendMessage({ channelId, content: "Hi" })}>
        Send
      </button>
    </div>
  );
}
```

## Scheduling

```typescript
// Schedule for later
await ctx.scheduler.runAfter(60000, internal.emails.sendReminder, { userId });
await ctx.scheduler.runAt(timestamp, internal.tasks.process, { taskId });

// Cron jobs (convex/crons.ts)
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("cleanup", { minutes: 30 }, internal.maintenance.cleanup);
crons.cron("daily report", "0 9 * * *", internal.reports.daily);
export default crons;
```

## File Storage

```typescript
// Generate upload URL (mutation)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Store file reference after upload
export const saveFile = mutation({
  args: { storageId: v.id("_storage"), name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
    });
  },
});

// Get URL to serve file
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

## HTTP Endpoints

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(internal.webhooks.process, { data: body });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

## Best Practices

1. **Always validate arguments** - Use `args` with validators on all functions
2. **Use indexes for queries** - Never use `.filter()` on large datasets; use `.withIndex()`
3. **Avoid `.collect()` on unbounded queries** - Use `.take(n)` or pagination
4. **Await all promises** - Missing awaits cause silent failures
5. **Keep queries/mutations fast** - Target <100ms; use actions for heavy work
6. **Don't call actions from clients** - Trigger via mutation → scheduler → action
7. **Use internal functions** - Hide implementation details from client API
8. **Let queries handle reads** - Don't return data from mutations for UI updates

## Common Patterns

See [references/PATTERNS.md](references/PATTERNS.md) for:
- Authentication patterns (Clerk, Auth0, Convex Auth)
- Pagination
- Optimistic updates
- Error handling
- Real-time subscriptions
- Components

## Environment Variables

```bash
# Set in dashboard or CLI
npx convex env set OPENAI_API_KEY sk-xxx

# Access in actions (not queries/mutations in default runtime)
const apiKey = process.env.OPENAI_API_KEY;

# For Node.js runtime functions
// convex/myAction.ts
"use node";
import { action } from "./_generated/server";
```

## Documentation Resources

- Full docs: https://docs.convex.dev
- Stack (patterns): https://stack.convex.dev
- Search: https://search.convex.dev
- Discord: https://convex.dev/community
# Convex Patterns Reference

## Authentication

### With Clerk

```typescript
// convex/auth.config.ts
export default {
  providers: [
    { domain: "https://your-clerk-domain.clerk.accounts.dev" },
  ],
};

// React setup
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

<ClerkProvider publishableKey={CLERK_KEY}>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <App />
  </ConvexProviderWithClerk>
</ClerkProvider>

// In functions - get user identity
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthenticated");
// identity.tokenIdentifier - unique user ID
// identity.email, identity.name, etc.
```

### Storing Users in Database

```typescript
// convex/schema.ts
users: defineTable({
  name: v.string(),
  email: v.string(),
  tokenIdentifier: v.string(),
}).index("by_token", ["tokenIdentifier"]),

// convex/users.ts
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      if (existing.name !== identity.name) {
        await ctx.db.patch(existing._id, { name: identity.name ?? "Anonymous" });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "",
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});
```

## Pagination

### Server-side

```typescript
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

### Client-side (React)

```tsx
import { usePaginatedQuery } from "convex/react";

function MessageList({ channelId }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    { channelId },
    { initialNumItems: 25 }
  );

  return (
    <div>
      {results.map(msg => <Message key={msg._id} {...msg} />)}
      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(25)}>Load More</button>
      )}
      {status === "LoadingMore" && <Spinner />}
    </div>
  );
}
```

## Optimistic Updates

```tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function TodoList() {
  const addTodo = useMutation(api.todos.add).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.todos.list, {});
      if (existing !== undefined) {
        localStore.setQuery(api.todos.list, {}, [
          ...existing,
          { 
            _id: crypto.randomUUID() as Id<"todos">,
            _creationTime: Date.now(),
            text: args.text,
            completed: false,
          },
        ]);
      }
    }
  );

  return <button onClick={() => addTodo({ text: "New todo" })}>Add</button>;
}
```

## Error Handling

### Application Errors

```typescript
import { ConvexError } from "convex/values";

export const join = mutation({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode))
      .unique();

    if (!room) {
      throw new ConvexError({ code: "ROOM_NOT_FOUND", message: "Room does not exist" });
    }

    if (room.isFull) {
      throw new ConvexError({ code: "ROOM_FULL", message: "Room is at capacity" });
    }

    // ... join logic
  },
});

// Client handling
try {
  await joinRoom({ roomCode });
} catch (error) {
  if (error instanceof ConvexError) {
    const { code, message } = error.data;
    if (code === "ROOM_FULL") showToast("Room is full");
  }
}
```

## Real-time Presence

```typescript
// convex/schema.ts
presence: defineTable({
  oderId: v.id("users"),
  roomId: v.id("rooms"),
  lastSeen: v.number(),
  cursor: v.optional(v.object({ x: v.number(), y: v.number() })),
}).index("by_room", ["roomId"]),

// convex/presence.ts
export const heartbeat = mutation({
  args: { 
    roomId: v.id("rooms"),
    cursor: v.optional(v.object({ x: v.number(), y: v.number() })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { 
        lastSeen: Date.now(), 
        cursor: args.cursor,
      });
    } else {
      await ctx.db.insert("presence", {
        oderId: identity.subject as Id<"users">,
        roomId: args.roomId,
        lastSeen: Date.now(),
        cursor: args.cursor,
      });
    }
  },
});

export const listActive = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - 30000; // 30 seconds
    const all = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    return all.filter((p) => p.lastSeen > cutoff);
  },
});
```

## Background Jobs / Workflows

```typescript
// Pattern: Mutation triggers action via scheduler
export const startProcessing = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    // Update status
    await ctx.db.patch(args.documentId, { status: "processing" });
    
    // Schedule the heavy work
    await ctx.scheduler.runAfter(0, internal.processing.processDocument, {
      documentId: args.documentId,
    });
    
    return args.documentId;
  },
});

// Internal action does the work
export const processDocument = internalAction({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    try {
      // Get document
      const doc = await ctx.runQuery(internal.documents.get, { id: args.documentId });
      
      // Do expensive work (API calls, etc.)
      const result = await someExpensiveOperation(doc);
      
      // Save result
      await ctx.runMutation(internal.documents.saveResult, {
        id: args.documentId,
        result,
        status: "completed",
      });
    } catch (error) {
      await ctx.runMutation(internal.documents.saveResult, {
        id: args.documentId,
        error: error.message,
        status: "failed",
      });
    }
  },
});
```

## Search

### Full-Text Search

```typescript
// convex/schema.ts
articles: defineTable({
  title: v.string(),
  body: v.string(),
  category: v.string(),
}).searchIndex("search_content", {
  searchField: "body",
  filterFields: ["category"],
}),

// convex/articles.ts
export const search = query({
  args: { 
    query: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("articles")
      .withSearchIndex("search_content", (q) => {
        let search = q.search("body", args.query);
        if (args.category) {
          search = search.eq("category", args.category);
        }
        return search;
      });
    
    return await q.take(20);
  },
});
```

### Vector Search

```typescript
// convex/schema.ts
documents: defineTable({
  content: v.string(),
  embedding: v.array(v.float64()),
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
}),

// convex/documents.ts
export const similarDocuments = query({
  args: { embedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withVectorIndex("by_embedding", {
        vector: args.embedding,
        limit: 10,
      });
  },
});
```

## Server-Side Rendering (Next.js)

```tsx
// app/page.tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function Page() {
  const preloaded = await preloadQuery(api.messages.list, { channelId: "main" });
  return <MessageList preloaded={preloaded} />;
}

// components/MessageList.tsx
"use client";
import { usePreloadedQuery } from "convex/react";

export function MessageList({ preloaded }) {
  const messages = usePreloadedQuery(preloaded);
  return <div>{/* render messages */}</div>;
}
```

## Rate Limiting Pattern

```typescript
// convex/schema.ts
rateLimits: defineTable({
  key: v.string(),
  count: v.number(),
  windowStart: v.number(),
}).index("by_key", ["key"]),

// convex/rateLimit.ts
export const checkRateLimit = internalMutation({
  args: { 
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing || now - existing.windowStart > args.windowMs) {
      // New window
      if (existing) await ctx.db.delete(existing._id);
      await ctx.db.insert("rateLimits", {
        key: args.key,
        count: 1,
        windowStart: now,
      });
      return { allowed: true, remaining: args.limit - 1 };
    }

    if (existing.count >= args.limit) {
      return { allowed: false, remaining: 0 };
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, remaining: args.limit - existing.count - 1 };
  },
});
```

## Webhooks Pattern

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();
    
    // Verify webhook signature
    const event = await verifyStripeWebhook(body, signature);
    
    // Process asynchronously
    await ctx.runMutation(internal.webhooks.queueStripeEvent, { event });
    
    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

## Component Usage

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
app.use(rateLimiter);
export default app;

// In functions
import { components } from "./_generated/api";

export const doSomething = mutation({
  handler: async (ctx) => {
    const result = await ctx.runMutation(components.rateLimiter.limit, {
      key: "my-key",
      rate: 10,
      period: 60000,
    });
    if (!result.ok) throw new Error("Rate limited");
  },
});
```
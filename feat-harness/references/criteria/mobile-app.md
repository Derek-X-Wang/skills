# Mobile Application Quality Criteria

Evaluation rubric for mobile apps (React Native, Swift, Kotlin, Flutter). Customize weights during `/harness setup`.

## Dimensions

### 1. Native Feel (Weight: High)

Does the app feel like a native app? Proper navigation patterns, gestures, platform conventions (iOS Human Interface Guidelines, Material Design)?

| Score | Description |
|-------|-------------|
| 1 | Feels like a web page in a wrapper. No platform conventions. |
| 2 | Some native patterns but inconsistent. Mix of platform idioms. |
| 3 | Follows basic platform conventions. Standard navigation patterns. |
| 4 | Good native feel. Proper gestures, transitions, platform-specific UI. |
| 5 | Indistinguishable from a first-party app. Platform conventions mastered. |

### 2. Functionality (Weight: High)

Do all features work correctly? State management, data persistence, offline behavior, background tasks.

| Score | Description |
|-------|-------------|
| 1 | Core features broken. Crashes on basic flows. |
| 2 | Main flow works. Secondary features buggy. State management issues. |
| 3 | All features work on happy path. Some edge cases unhandled. |
| 4 | Reliable across scenarios. Good offline handling. State persists correctly. |
| 5 | Bulletproof. Offline-first, conflict resolution, background sync, deep links all work. |

### 3. Performance (Weight: High)

App startup time, scroll performance, animation smoothness (60fps), memory usage, battery impact.

| Score | Description |
|-------|-------------|
| 1 | Janky scrolling, slow startup, memory leaks, high battery drain. |
| 2 | Noticeable performance issues in some views. |
| 3 | Acceptable performance. No major jank. Reasonable startup time. |
| 4 | Smooth throughout. Fast startup, efficient rendering, lazy loading. |
| 5 | Highly optimized. 60fps everywhere, instant transitions, minimal memory footprint. |

### 4. Visual Design (Weight: Medium)

Coherent design language, good use of platform typography and spacing, appropriate use of color and hierarchy.

| Score | Description |
|-------|-------------|
| 1 | No visual coherence. Inconsistent styling. |
| 2 | Basic styling but generic. Doesn't feel designed. |
| 3 | Acceptable design. Consistent but unremarkable. |
| 4 | Good design. Intentional choices, good hierarchy, pleasant to use. |
| 5 | Beautiful. Distinctive design that enhances the experience. |

### 5. Accessibility (Weight: Medium)

VoiceOver/TalkBack support, Dynamic Type/font scaling, sufficient contrast, touch target sizes.

| Score | Description |
|-------|-------------|
| 1 | Completely inaccessible. No labels, no scaling support. |
| 2 | Some labels present but incomplete. Font scaling breaks layout. |
| 3 | Basic accessibility. Labels on key elements. Adequate touch targets. |
| 4 | Good accessibility. Full label coverage, font scaling works, good contrast. |
| 5 | Excellent. Fully accessible, tested with screen reader, alternative navigation. |

### 6. Error & Edge Cases (Weight: Medium)

Network failures, permission denials, low storage, interruptions (calls, notifications), orientation changes.

| Score | Description |
|-------|-------------|
| 1 | Crashes on network failure or permission denial. |
| 2 | Basic error handling but poor UX. Generic error messages. |
| 3 | Handles common errors gracefully. Retry for network issues. |
| 4 | Good error UX. Offline mode, queued actions, helpful error states. |
| 5 | Resilient. Graceful degradation for all edge cases, state recovery after interruptions. |

## Optional Dimensions

- **Security**: Keychain/Keystore usage, certificate pinning, biometric auth, data at rest encryption
- **Battery**: Background task efficiency, location usage, network polling frequency
- **App Size**: Bundle size, asset optimization, on-demand resources
- **Deep Linking**: Universal links, app links, deferred deep links

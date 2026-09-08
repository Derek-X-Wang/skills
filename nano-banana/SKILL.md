---
name: nano-banana
description: Generate or edit raster images through the Gemini CLI Nano Banana extension when the user explicitly chooses Nano Banana or wants an alternative after an unsatisfactory native image result. Prefer the current harness's native image capability for ordinary image requests.
allowed-tools: Bash(gemini:*)
---

# Nano Banana Image Generation

Generate professional images via the Gemini CLI's nanobanana extension.

## When to Use This Skill

Use the current harness's native image capability first when available. Use this route when the user explicitly requests Nano Banana/Gemini image generation, or as an alternative when the user is unsatisfied with the native result. Announce a fallback choice and keep it within the requested image task and existing disclosure authority.

This skill does not own general visualizations, charts, or diagrams. Prefer the task's appropriate structured or plotting tool for those; `/diagram` below is only an extension option when the user has chosen a raster Nano Banana result.

## Before First Use

1. Verify the Gemini CLI and extension are available; inspect current CLI/extension help before relying on command examples:
   ```bash
   command -v gemini
   gemini extensions list
   ```
2. If missing, report the unavailable route. Install the extension only when dependency installation is authorized:
   ```bash
   gemini extensions install https://github.com/gemini-cli-extensions/nanobanana
   ```
3. Verify API key is set:
   ```bash
   [ -n "$GEMINI_API_KEY" ] && echo "API key configured" || echo "Missing GEMINI_API_KEY"
   ```

## Command Selection

| User Request | Command |
|--------------|---------|
| "make me a blog header" | `/generate` |
| "create an app icon" | `/icon` |
| "draw a flowchart of..." | `/diagram` |
| "fix this old photo" | `/restore` |
| "remove the background" | `/edit` |
| "create a repeating texture" | `/pattern` |
| "make a comic strip" | `/story` |

## Available Commands

Examples below retain the Gemini CLI route and must match the installed extension's help. Use ordinary approval handling; broad autoapproval is not required. Do not infer an Antigravity command or working migration from the Nano Banana name.

For an attended session, pass an initial prompt explicitly while retaining normal approval prompts:

```bash
gemini --approval-mode default -i "/generate 'minimalist blue mountain illustration, no text'"
```

`-i` / `--prompt-interactive` submits the initial prompt and keeps the session interactive. The positional examples below also use interactive mode; `-p` selects headless mode. Handle ordinary approvals within the task's authority. If an unattended/headless run cannot satisfy a required approval, report the blocker to the orchestrator in worker mode or the user in direct mode; do not bypass it with broad autoapproval.

| Command | Use Case |
|---------|----------|
| `gemini "/generate 'prompt'"` | Text-to-image generation |
| `gemini "/edit file.png 'instruction'"` | Modify existing image |
| `gemini "/restore old_photo.jpg 'fix scratches'"` | Repair damaged photos |
| `gemini "/icon 'description'"` | App icons, favicons, UI elements |
| `gemini "/diagram 'description'"` | Requested raster diagrams |
| `gemini "/pattern 'description'"` | Seamless textures and patterns |
| `gemini "/story 'description'"` | Sequential/narrative images |
| `gemini "/nanobanana prompt"` | Natural language interface |

## Common Options

- `--count=N` - Generate N variations (1-8)
- `--preview` - Auto-open generated images
- `--styles="style1,style2"` - Apply artistic styles
- `--format=grid|separate` - Output arrangement

## Common Sizes

| Use Case | Dimensions | Notes |
|----------|------------|-------|
| YouTube thumbnail | 1280x720 | `--aspect=16:9` |
| Blog featured image | 1200x630 | Social preview friendly |
| Square social | 1080x1080 | Instagram, LinkedIn |
| Twitter/X header | 1500x500 | Wide banner |
| Vertical story | 1080x1920 | `--aspect=9:16` |

## Model Selection

Verify supported models and current pricing through the installed extension and provider before selecting a model. Historical extension default: `gemini-2.5-flash-image`.

Example model override, only if currently supported:
```bash
export NANOBANANA_MODEL=gemini-3-pro-image-preview
```

## Blog Featured Image Examples

```bash
# Modern illustration style
gemini "/generate 'modern flat illustration of developer coding at laptop, purple and blue gradient background, minimalist style, no text' --preview"

# Professional photography style
gemini "/generate 'professional editorial photo of coffee cup next to laptop on wooden desk, morning sunlight, shallow depth of field, no text' --count=3"

# Tech/abstract
gemini "/generate 'abstract visualization of neural network connections, dark background with glowing blue nodes, futuristic style' --preview"
```

## Icon Generation

```bash
gemini "/icon 'minimalist app logo for productivity tool' --sizes='64,128,256,512' --type='app-icon' --corners='rounded'"
```

## Diagram Generation

```bash
gemini "/diagram 'user authentication flow with OAuth' --type='flowchart' --style='modern'"
```

## Output Location

All generated images are saved to `./nanobanana-output/` in the current directory.

## Presenting Results

After generation completes:
1. List contents of `./nanobanana-output/` to find generated files
2. Present the most recent image(s) to the user
3. Offer to regenerate with variations if needed

## Refinements and Iterations

When the user asks for changes:
- **"Try again" / "Give me options"**: Regenerate with `--count=3`
- **"Make it more [adjective]"**: Adjust prompt and regenerate
- **"Edit this one"**: Use `gemini "/edit nanobanana-output/filename.png 'adjustment'"`
- **"Different style"**: Add `--styles="requested_style"` to the command

## Prompt Tips

1. **Be specific**: Include style, mood, colors, composition details
2. **Add "no text"**: If you don't want text rendered in the image
3. **Reference styles**: "editorial photography", "flat illustration", "3D render", "watercolor"
4. **Specify aspect ratio context**: "wide banner", "square thumbnail", "vertical story"

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `GEMINI_API_KEY` not set | `export GEMINI_API_KEY="your-key"` |
| Extension not found | Report unavailable; install only when authorized |
| Quota exceeded | Wait for reset or switch to flash model |
| Image generation failed | Check prompt for policy violations, simplify request |
| Output directory missing | Will be created automatically on first run |

# toille-term

Browser-native Interactive Cybernetic Terminal Shell & Dev Engine built with **SolidJS**, **TypeScript**, and **Vite**.

Hosted at [term.toille.uk](https://term.toille.uk).

## Overview

Toille Terminal is an in-browser interactive UNIX/cyberpunk command shell running locally with 0ms server latency. It features rich terminal history, tab autocomplete, vocal synthesis briefings, hands-free Web Speech voice command recognition, virtual filesystem navigation, game launcher triggers, and live system telemetry.

## Features

- **Interactive Command REPL**: Shell with history traversal (Up/Down arrow), tab auto-completion, and command aliases.
- **Built-in System Diagnostics**: Live commands for `status`, `battery`, `network`, `solar`, `hardware`, and `screen`.
- **Hands-Free Voice Recognition**: Web Speech voice input integration with tactical microphone commands (`mic on`, `voice listen`).
- **Tactile Audio Synthesis**: System audio briefings and vocal readouts synthesized directly via Web Speech API (`briefing`, `say <text>`).
- **Gamepad & Telemetry Cockpit**: Real-time gamepad hardware polling and telemetry bridge dispatching.
- **Visual Stacking & Window Dragging**: Responsive window bar with collapse/maximize states and quick chips toolbar.

## Available Commands

| Command | Description |
|---|---|
| `help` | Display list of available commands and instructions |
| `whoami` | Identity overview and developer background |
| `skills` | Technical skills matrix and frameworks |
| `resume` / `cv` | Career history and enterprise achievements |
| `status` | System health, battery, and network status |
| `briefing` | Synthesized tactical audio status briefing |
| `mic` / `listen` | Toggle hands-free voice speech recognition |
| `theme` | Toggle cybernetic high-contrast and normal themes |
| `eco` | Toggle low-power energy saving mode |
| `gamepad` | Inspect connected gamepad controllers |
| `clear` | Clear terminal display buffer |

## Tech Stack

- **SolidJS** for fine-grained reactive DOM updates
- **TypeScript** with strict type checks
- **Web Speech API** for hands-free recognition and speech synthesis
- **Vite** for sub-second development and production builds
- **Vitest** for component and unit testing
- **Fallow** for architecture boundaries and code health gates

## Development

```bash
# Start development server
npm run dev

# Run unit and component tests
npm test

# Run type checks
npm run check

# Lint with Oxlint and ESLint
npm run lint

# Build production bundle
npm run build

# Run code health checks
npm run fallow:health
```

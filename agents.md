# AGENTS.md

## Overview

This repository contains the project source code, configuration, documentation, and supporting assets.

## General Guidelines

* Keep changes focused and minimal.
* Follow existing project structure, conventions, and patterns.
* Prefer simple, readable, maintainable solutions.
* Avoid unnecessary dependencies or architectural changes.
* Preserve existing behavior unless a change is explicitly required.
* Update documentation when behavior or interfaces change.

## Production Rules

* **Follow all production rules and requirements without exception.**
* Treat existing production behavior, safeguards, policies, and constraints as authoritative.
* Do not bypass, weaken, disable, or work around production safeguards.
* Do not make assumptions that could compromise production reliability, security, data integrity, privacy, or compliance.
* Prefer backward-compatible changes.
* Do not introduce breaking changes without explicit approval.
* Do not modify production configuration, infrastructure, permissions, secrets, or deployment behavior unless explicitly required.
* Never expose, commit, or hard-code secrets, credentials, tokens, or sensitive configuration.
* When requirements are ambiguous, choose the safest production-compatible behavior and ask for clarification when necessary.

## Development

* Inspect relevant files before making changes.
* Reuse existing utilities and patterns where practical.
* Keep code consistent with surrounding code.
* **Code Style**: Do not write code in the form of classes and objects; write in the form of pure, modular, readable functions.
* **Interface & Type Management**: All interfaces and TypeScript types must reside in a dedicated `interfaces/` folder (e.g., `src/interfaces/<module_name>.interface.ts` and barrel-exported via `src/interfaces/index.ts`). Every time you create an interface, first check if it exists in the `interfaces/` folder; if not, create it there in a modular way and export it.
* **Module Documentation**: Keep comprehensive documentation for every feature/module in `docs/<module_name>/` (including architecture, API references, and frontend/consumer integration guides) updated as each module is built.
* **Shared Database**: All database models, Prisma client, and migrations must reside in `@repo/database` (`packages/database`) so they are sharable across all services (backend, background workers, AI pipelines).
* **Component Render Optimization**: A component should re-render only when something it actually depends on has changed. Keep state as close as possible to the components that use it, split components into independent render boundaries, and apply targeted memoization (`React.memo`, `useMemo`, `useCallback`, fine-grained selectors) to eliminate cascading re-renders across parent layouts or unrelated sibling components.
* **Getting Started Documentation**: Maintain and keep `docs/how_to_start/*.md` updated as the project evolves.
* **Weight Unit Standard**: Calculate, process, store, and display all agricultural crop weights, lot sizes, capacities, and rates strictly in **KG (Kilograms)** only. Do NOT calculate or display weights in Quintals (Qtl).
* Run appropriate tests, checks, and builds after making changes.

## Testing

* Add or update tests for meaningful behavioral changes.
* Run the most relevant test suite before completing work.
* Investigate failing checks rather than ignoring them.
* Do not claim a change is verified if the relevant checks were not run.

## Git

* **Branch Workflow**: Do NOT directly modify or push to the `main` branch. Always work on feature branches named `userName/<module_name>` (e.g., `rupesh/auth`). Only push to that specific `userName/<module_name>` branch.
* **Always Commit on Feature Branches**: Whenever you complete or change a feature/task, always create a focused git commit on the current specific feature branch (never on `main`).
* Keep commits focused, well-scoped, and documented with clear, descriptive commit messages.
* Avoid modifying unrelated files.
* Do not commit secrets, credentials, generated artifacts, or local environment files.

## Communication

* Briefly summarize what changed.
* Mention important tests and checks that were run.
* Clearly call out assumptions, limitations, risks, or unresolved issues.

## React Native & Mobile

* **Keyboard Avoidance**: Whenever an input that triggers a virtual keyboard is focused/clicked, it must NEVER be overlapped by the keyboard. Always wrap input flows with proper keyboard avoidance (`KeyboardAvoidingView` with platform-specific behavior/offset, `ScrollView` with `keyboardShouldPersistTaps="handled"`, `automaticallyAdjustKeyboardInsets={true}`, and appropriate bottom insets) so that the focused input shifts/scrolls smoothly above the keyboard.
* **Component Architecture**: Split screens into modular, pure function components. Never dump entire screens into a single monolithic file.
* **Styling & Aesthetics**: Adhere to curated color palettes, sleek micro-interactions, responsive touch targets (minimum 44x44), and polished native feel.

## frontend 
* always try to compoenets that are already present (if essential ) 
* make components or relavant UI donnot dump everything in single file 


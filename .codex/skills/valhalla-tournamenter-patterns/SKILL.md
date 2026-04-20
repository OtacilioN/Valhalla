---
name: valhalla-tournamenter-patterns
description: Use when designing or refining Valhalla screens so they preserve the visual design language of Tournamenter and tournamenter-obr, especially color hierarchy, density, spacing, panel composition, and operational OBR UI clarity.
---

# Valhalla Tournamenter Patterns

Use this skill when changing `Valhalla` screens, layouts, or UI components that should feel visually aligned with the Tournamenter lineage.

## Goal

Modernize in React/Next.js without losing the visual discipline of the legacy system:

- strong institutional blue as the main anchor
- compact, operational layouts optimized for tournament work
- light gray surfaces with crisp borders
- clear hierarchy between top bars, work panels, and status areas
- low-friction forms for judges and staff under pressure

## Source Of Truth

Read [references/tournamenter-patterns.md](references/tournamenter-patterns.md) before making structural changes. It contains the extracted patterns and concrete legacy references.

## Working Rules

1. Use Tournamenter blue as the visual anchor and reserve stronger contrast for navigation, active states, and primary actions.
2. Prefer compact spacing over oversized SaaS-style whitespace; these screens are tools, not marketing pages.
3. Keep panels readable with subtle gray backgrounds, visible borders, and restrained shadows.
4. Use visual hierarchy similar to the legacy app:
   strong top bar
   lighter workspace surface
   bounded cards/panels for each operational task
5. Prioritize clarity under pressure:
   judges and secretariat users should scan actions and state in seconds.
6. Avoid ornamental gradients, glassmorphism, oversized radius, and playful decoration unless there is a concrete OBR-specific reason.
7. Typography should be neutral and utilitarian; Roboto-like UI rhythm is preferred over trendy display choices.
8. Buttons, badges, tabs, and form controls should look consistent across admin, referee, ranking, and login flows.

## Implementation Checklist

- Check whether the screen reads as an operational console, not a generic dashboard template.
- Reuse shared color and spacing tokens before adding local classes.
- Make primary actions obvious from a distance.
- Keep dense data views legible on notebooks and tablets.
- Use labels and state chips to reduce ambiguity for event staff.
- When in doubt, choose function-first simplicity over visual novelty.

## Where To Apply In Valhalla

- `src/app/globals.css`
- `src/app/login/`
- `src/app/dashboard/`
- `src/app/ranking/`
- shared UI in `src/presentation/components/ui/`

## Anti-Patterns

- Generic startup-landing visuals that look detached from tournament operations.
- Oversized cards, excessive empty space, or weak action contrast.
- Purple-heavy or trendy default palettes unrelated to the legacy product.
- Mixing too many visual idioms across admin, referee, and ranking screens.

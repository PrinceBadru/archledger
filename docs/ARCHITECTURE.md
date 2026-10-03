# Architecture

This document describes the high-level architecture of ArchLedger.

## Context

ArchLedger is a system catalog and decision log that acts as the single source of truth for architectural knowledge.

## Container

It is built as a monolithic Next.js application on Vercel, utilizing Neon Postgres for storage.
The catalog model is strongly typed and stored in a relational schema. Graph analyses (cycles, blast radius, single points of failure) are computed server-side via pure TypeScript functions using data from the database.

## Graph Engine Flow

- `buildGraph(snapshot)`: constructs the directed multigraph from components and dependencies.
- `scc(graph)`: detects dependency cycles.
- `blastRadius(graph, id)`: performs impact analysis.

## Decision Automaton

Decisions follow a strict lifecycle automaton:
proposed -> accepted | rejected
accepted -> deprecated | superseded
deprecated -> superseded
(rejected, superseded are terminal)

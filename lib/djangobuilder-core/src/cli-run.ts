#!/usr/bin/env bun
// Direct-run entrypoint for the core CLI. Kept separate from cli.ts so that
// cli.ts stays a pure, importable module (see bin/django-builder).
import { main } from "./cli";

main(process.argv.slice(2));

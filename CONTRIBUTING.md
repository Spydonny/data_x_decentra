# Contributing to KYA

Thanks for your interest in improving Know Your Agent.

## How to Contribute

### Reporting Issues
- Open a GitHub issue for bugs, regressions, or feature ideas.
- Include reproduction steps, expected behavior, and actual behavior.
- Attach screenshots, logs, or request payloads when they help.

### Submitting Pull Requests
1. Create a feature branch from `main`.
2. Keep changes scoped and explain user-facing impact in the PR description.
3. Update docs when routes, env vars, or setup steps change.
4. Run the relevant checks before opening the PR.
5. Open the Pull Request against `main`.

### Development Checklist
- Backend changes: `cd kya-backend && pytest -q`
- Frontend changes: `cd kya_front && npm run build`
- On-chain changes: `cd kya-solana-scripts && anchor build`
- Integration changes: update `README.md`, `docs/api.md`, or `README_MCP.md` as needed

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add agent lookup endpoint
fix: handle missing destination in verify-intent flow
docs: update MCP onboarding guide
test: add coverage for intent log queries
```

### Local Setup
See [Quick Start](README.md#quick-start) in the root README.

## Code of Conduct
Be respectful, clear, and constructive. KYA is infrastructure for trust, and the repo should reflect that in how we collaborate.

## Questions
Open an issue or start from the backend MCP guide at [kya-backend/README_MCP.md](kya-backend/README_MCP.md).

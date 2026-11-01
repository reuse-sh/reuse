# Changesets

Each pull request that changes a published package adds a changeset here. Run `pnpm changeset`, pick the packages, choose the bump, and write one line a user of the package would understand.

The release workflow collects the changesets into a "Version packages" pull request. Merging it bumps the versions, writes each package's CHANGELOG.md, and publishes to npm.

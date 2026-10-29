# Security policy

## Reporting a vulnerability

Please report security problems privately through GitHub's
[private vulnerability reporting](https://github.com/nsrobin/kisti/security/advisories/new)
rather than in a public issue. Include the steps to reproduce and the app version.

## How Kisti protects your data

- **No network access.** Release builds ship without the Android `INTERNET` permission and make no network calls. There are no accounts, analytics, ads or crash reporters.
- **On-device only.** Loans and settings are stored in the app's private storage (MMKV) and are excluded from Android cloud backups (`allowBackup="false"`).
- **Signed releases.** Official APKs are signed with a private release key that is never stored in this repository. Check the SHA-256 checksums published with each release before installing.
- **Supply chain.** Dependencies are reviewed by Dependabot, and CI actions are pinned to exact commits.

Kisti stores loan amounts unencrypted inside the app sandbox, which other apps cannot read. Anyone with full access to an unlocked or rooted phone can still read app data, so keep your phone locked.

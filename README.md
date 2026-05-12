# expo-ui-alert-45700-repro

Wanted to use a native iOS alert from `@expo/ui/swift-ui` and realized the component didn't exist. Filed [`expo/expo#45700`](https://github.com/expo/expo/pull/45700) to add it. This repo is the minimal repro so maintainers and reviewers don't have to spend time recreating one to validate the PR.

| Basic flow | Destructive role | Title only |
|---|---|---|
| ![basic](screenshots/basic.png) | ![destructive](screenshots/destructive.png) | ![title only](screenshots/title-only.png) |

| Long title (~200 chars) | Empty title | Home screen |
|---|---|---|
| ![long title](screenshots/long-title.png) | ![empty title](screenshots/empty-title.png) | ![home](screenshots/home.png) |

## Run

You need Xcode with an iOS simulator (or device) and Bun.

```bash
bun install
bun run prebuild
bun run ios
```

First build takes 5-10 minutes while Xcode compiles the dev client and `libExpoUI.a` with the new `AlertView.swift`. After that, JS edits hot-reload through Metro.

## What's on the home screen

Each card mounts one `Alert` configuration and exercises a specific scenario. The "Last action" row at the top updates after every interaction so you can confirm the JS state sync path.

| # | Card | What to confirm |
|---|---|---|
| 1 | Basic flow (cancel + confirm) | Trigger opens alert centered. `Sign Out` records `Basic: confirmed`. Cancel role sits at the bottom. Tapping an action dismisses the alert. |
| 2 | Destructive role | Both trigger and inner `Delete` render red. |
| 3 | Title-only | No message slot. Alert renders title + single OK. |
| 4 | Two alerts on same screen | A and B have independent state. Opening A does not affect B. |
| 5 | Missing `Alert.Trigger` | Opens programmatically. Xcode console emits `Alert requires an Alert.Trigger child to be visible`. |
| 6 | Rapid toggle stress | Flips `isPresented` six times at 60ms intervals. Alert lands open. No double-fire, no stuck state. |
| 7 | Long title (~200 chars) | Title wraps or truncates without breaking the centered layout. |
| 8 | Empty title | No title row, message + button still render. |
| 9 | Programmatic open and close | Driven entirely by external state. "Open in 1s" delay-fires. "Force close" dismisses without a user tap. |

## System-state checks

These need simulator settings changes, not just in-app interaction.

| Setting | Where | What to confirm |
|---|---|---|
| Dark mode | `Cmd+Shift+A` in the simulator | Alert chrome flips dark, text legible, buttons visible. |
| Landscape | `Cmd+Right Arrow` | Alert re-centers, doesn't clip. |
| Dynamic Type AX5 | `Settings → Accessibility → Display & Text Size → Larger Text → drag to max` | Alert title and message scale up. |
| iOS 15 (minimum SDK) | Boot an iOS 15 sim, `bun run ios` | `.alert(_:isPresented:actions:message:)` works on the lowest supported iOS. |

## Versions pinned

- `expo` `56.0.0-canary-20260506-03817f5` (or any later canary)
- `react` `19.2.3`, `react-native` `0.85.3`
- `@expo/ui` `56.0.5` from the patched build at `./expo-ui-56.0.5.tgz`

`package.json` references the patched build via `"@expo/ui": "file:./expo-ui-56.0.5.tgz"`. `bun install` picks it up on every install.

## What the patch changes

`patches/PR-45700.patch` is the source diff filed upstream as [`expo/expo#45700`](https://github.com/expo/expo/pull/45700). 17 files, +673 / -8. Adds:

- New JS bridge at `packages/expo-ui/src/swift-ui/Alert/index.tsx` with `Alert.Trigger`, `Alert.Actions`, and `Alert.Message` slots.
- SwiftUI view at `packages/expo-ui/ios/Alert/AlertView.swift` applying `.alert(props.title, isPresented: $isPresented, actions:, message:)`.
- Props class at `packages/expo-ui/ios/Alert/AlertProps.swift` with `title`, `isPresented`, and the `onIsPresentedChange` event dispatcher.
- Docs page at `docs/pages/versions/{unversioned,v55.0.0}/sdk/ui/swift-ui/alert.mdx` plus the generated API data.
- Replaced the "Not implemented yet" placeholder at `apps/native-component-list/src/screens/UI/AlertDialogScreen.ios.tsx` with the same four variants you see in this repro.
- Module registration in `ios/ExpoUIModule.swift`, export from `src/swift-ui/index.tsx`, gdad mapping in `tools/src/commands/GenerateDocsAPIData.ts`, and a CHANGELOG entry.

Rebuilding the patched `@expo/ui` from the PR branch:

```bash
git clone https://github.com/expo/expo.git
cd expo
git fetch origin pull/45700/head:feat/expo-ui-swift-ui-alert
git checkout feat/expo-ui-swift-ui-alert
pnpm install
cd packages/expo-ui
pnpm build
npm pack --pack-destination /path/to/this/repro/
```

## License

MIT.

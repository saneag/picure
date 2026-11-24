# Picure

Picure = Picture + Cure. An offline Android app that builds before/after photo collages of patients (1–4 photos), with per-photo labels ("Before", "After 2 sessions") and patient details. Built with React Native (Expo prebuild), NativeWind (Tailwind) and Reusables-style components.

## Features

- Pick 1–4 photos from the gallery (referenced, not copied) or take them with the in-app camera (stored privately, hidden from the gallery).
- Several layouts per photo count; fixed 4:5 output. Drag/pinch each photo to fit its cell, tap to view fullscreen.
- Text label on each photo with color, size and position options.
- Patient name, email, phone, description, number of procedures (all optional).
- Save inside the app and/or export to the gallery album **Picure**.
- Saved collages: search by name, edit images, labels and details, then **Save as copy** or **Override** (with a warning). Delete with confirmation.
- App lock (biometric/device credential), backup export, English and Russian.
- Works fully offline. Release builds have the `INTERNET` permission removed; there are no network calls, analytics or backend.

## Requirements

- Node 22+, JDK 17, Android SDK (platform tools, an emulator or a device).
- A development build is required (Expo Go is not supported because of native modules).

## Run locally

```bash
npm install
npx expo prebuild --platform android   # generates android/ (git-ignored)
npm run android                        # builds, installs and starts Metro
```

Other scripts: `npm run lint` (type check), `npm test` (unit tests, single worker), `npm run format`.

## Release (GitHub Actions)

Workflow: `.github/workflows/release.yml`. It runs on a manual dispatch (enter a version such as `1.0.0`) or when a `v*` tag is pushed. It type-checks, tests, builds a release APK, signs it and publishes `Picure-vX.Y.Z.apk` to the repo's **Releases** page.

### One-time signing setup

```bash
keytool -genkeypair -v -keystore picure.jks -alias picure \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -i picure.jks | pbcopy   # macOS; use `base64 -w0 picure.jks` on Linux
```

Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | base64 of `picure.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `picure` |
| `ANDROID_KEY_PASSWORD` | key password |

Keep `picure.jks` safe and backed up: updates must be signed with the same key. Never commit it.

Install the APK on the phone by downloading it from Releases and allowing installs from your browser/files app.

## Project structure

```
app/                  Expo Router screens (thin, compose features)
  (tabs)/index.tsx    Saved collages list + search
  (tabs)/settings.tsx Language, app lock, backup
  collage/editor.tsx  Create/edit a collage (collage tab + details tab)
  collage/[id].tsx    Saved collage detail
  gallery-picker.tsx  In-app multi-select gallery (MediaStore references)
  camera.tsx          In-app camera
src/
  features/collage/   Canvas, cells, layouts, geometry, draft state, sheets
  services/           collage-service (save/copy/override), gallery, file-storage, backup
  db/                 SQLite migrations and repositories
  components/ui/      Reusable UI primitives (Tailwind classes only)
  i18n/               en.ts, ru.ts
```

How the main pieces fit:

- **Draft** (`draft-context`): in-memory state of the collage being edited (layout, slots, labels, patient).
- **Layouts** (`layouts.ts`): pure data describing cell rectangles per image count; `geometry.ts` converts pan/zoom to stored fractions so the result is device independent.
- **Saving** (`collage-service.saveDraft`): renders the canvas off-screen to an image, writes it to private storage, and stores data in SQLite. Mode `new`/`copy` creates a new row; `override` replaces the existing one.
- **Gallery export** (`gallery.ts`): saves the rendered image into the "Picure" album.

## Extending

- New layout: add an entry in `src/features/collage/layouts.ts` (and a test in the layouts tests).
- New field: add a migration to `src/db/migrations.ts` (append only), update the repository and the Details tab.
- New language: add `src/i18n/<code>.ts` and register it in the i18n setup.

## License

See `LICENSE`.

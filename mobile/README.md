# Femantic Analytics Mobile

Expo React Native app for the Femantic analytics API.

## Local development

```bash
npm install
npm start
```

The default API is `https://analytics.globalcareerhub.org`. Override it with:

```bash
EXPO_PUBLIC_API_URL=https://analytics.globalcareerhub.org npm start
```

## Preview APK through GitHub Actions

1. Install EAS CLI and create an Expo account/project.
2. Create an Expo access token with `eas token:create`.
3. Add it to the GitHub repository as the `EXPO_TOKEN` Actions secret.
4. Open **Actions > Femantic Mobile APK > Run workflow**.
5. Download `femantic-preview-apk` from the completed workflow artifacts.

The workflow also runs automatically when files under `mobile/` change. It builds an internal-distribution Android APK through EAS and uploads it as a 14-day GitHub artifact.

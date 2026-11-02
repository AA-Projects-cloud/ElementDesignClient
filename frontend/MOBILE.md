# Element Design - Android & iOS app (Capacitor)

The mobile apps are the same website wrapped in a native shell, so every website change reaches the apps too.

## After changing the website
```
npm run cap:sync        # builds the website and copies it into the Android and iOS projects
```

## Android (works on Windows, Mac, Linux)
1. Install Android Studio.
2. `npm run cap:android` opens the project. Press Run to test on a phone or emulator.
3. Release build: Android Studio -> Build -> Generate Signed Bundle / APK.

Command-line test build (needs JDK 17 and the Android SDK):
```
cd android
./gradlew assembleDebug        # -> android/app/build/outputs/apk/debug/app-debug.apk
```

## iOS (needs a Mac with Xcode)
1. `npm install` then `npm run cap:ios` opens the project in Xcode.
2. Choose your Apple developer team under Signing & Capabilities, then Run / Archive.

## Before publishing
- Change `appId` in `capacitor.config.ts` (currently `com.elementdesign.app`) to your own unique id.
- Icons and splash screen come from `resources/` - replace the files and run `npm run cap:icons`.
- The app needs the same `.env.local` values as the website (Supabase URL and anon key) when you build.

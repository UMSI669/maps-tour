# Expo Maps Tour: City Explorer

A small Expo + React Native code tour that turns an Ann Arbor city guide into an interactive map. The lessons cover a map region, data-driven markers, selection, map taps, overlays, camera controls, foreground location permission, and local search. The app keeps its data and UI local and uses explicit React state.

## Branches

- `main` is the student starter. The app launches to a useful static city guide; each lesson is a switch in `App.tsx`. Feature tests are intentionally red until the tour is completed. `npm run check-progress:report` reports which parts remain without failing.
- `complete` is the reference implementation with all switches enabled. It should pass `npm run verify`.

The progress checker parses active TypeScript/JSX with Babel. It does not count lesson headings or commented code as completed work. Main-branch CI should report progress and run infrastructure tests; complete-branch CI should run full verification.

## Student setup

```sh
git clone <repository-url>
cd maps-tour
git switch main
npm ci
```

### This requires an Emulator or Device - no Web Mode
This uses Map APIs built into the device that browsers on your laptop do not have.

### iOS students

Run `npm start` and press `i`, or run `npm run ios`, to start the project in Expo Go. Stop any Metro server already running in development-build mode before starting again. iOS uses Apple Maps by default, so no Google Maps key is required.

### Android students

Install the [Android development APK shared for this class](https://drive.google.com/file/d/1H0xno7wLBqRSyFQxEBHb0t2-ICpYSCPI/view?usp=drive_link) on an Android phone or emulator. The Drive file is restricted to the school.

**Android emulator:** download the APK to your computer, start the emulator, then drag the APK file onto the emulator window and confirm installation.

**Android phone:** open the class link while signed in with your school account, download the APK, then open it from Downloads. If Android asks, allow installs from the browser or Drive app for this install, then confirm. The sideload warning is expected for an instructor-built class app.

After installing the APK, start Metro from this project:

```sh
npm run start:dev-client
```

Open the installed **maps-tour** development app (it may show Expo branding) and connect to Metro's QR code. On an emulator with Android SDK tools installed, `npm run android` starts Metro and opens the development app automatically. Students edit the tour code on `main` and reload; they do not build the APK, create Google Cloud keys, or manage signing credentials. Google Maps is blank in the current Expo Go Android client for this library; see [react-native-maps issue #5888](https://github.com/react-native-maps/react-native-maps/issues/5888).

Both platforms need a running Metro server to see JavaScript edits. The app uses Apple Maps on iOS and Google Maps on Android; `react-native-maps` has no browser implementation.

The SDK-compatible `react-native-maps` and `expo-location` packages are already recorded in `package-lock.json`; `npm ci` installs them. They were originally added with `npx expo install react-native-maps expo-location`.

## Instructor: create the shared Android development APK

This is a one-time instructor task. Students only install the resulting APK.

1. In Google Cloud, enable billing and **Maps SDK for Android**.
2. Generate the native Android project so Expo creates the debug keystore used by the APK:

   ```sh
   npx expo prebuild --clean --platform android
   ```

3. Get the SHA-1 fingerprint from the generated APK signer key:

   ```sh
   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

4. Create a real Android API key for this project (not a sample/demo key). Restrict it to **Maps SDK for Android** and the app ID `edu.example.mapstour` plus the SHA-1 printed above. Put it in `.env` as `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`. The key is embedded in the APK and visible to clients, so keep restrictions enabled. `.env` is ignored by Git; don't send the key to students or commit it.
5. On macOS, point the build shell at Android Studio's SDK location (use the path shown in Android Studio's SDK Manager if yours differs):

   ```sh
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export ANDROID_SDK_ROOT="$ANDROID_HOME"
   export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
   ```

6. With the same terminal open, regenerate and install the development APK with the configured key:

   ```sh
   npx expo prebuild --clean --platform android
   npm run android:build
   ```

7. Upload `android/app/build/outputs/apk/debug/app-debug.apk` to the school-restricted Drive location above. Students install this same APK and run `npm run start:dev-client` to connect it to their local Metro server. They do not need to build native code, set up EAS, or access the Google Cloud project.

If the Google Maps key or native config changes, regenerate and rebuild the APK. `.env.example` lists the Android key variable used by this tour.

These API keys are used by a client app, so restrictions and usage limits matter. Do not add service-account credentials or private keys to the app.

## The tour

Complete **Parts 1–8 in order**. Search for each `PART N — ...` heading in `App.tsx`. In every part, change exactly the named `LESSONS` property from `false` to `true`; the feature implementation is already present. Each part includes why it matters, a design question, what to enable, how to verify the result, and the next heading.

After each part, run:

```sh
npm run check-progress
npm test
```

1. Show a map centered on the city.
2. Render markers from the local places array.
3. Select a marker and show its details.
4. Tap the map to add a temporary pin and show its coordinates.
5. Draw a route and a tour boundary.
6. Control the camera to fit places or focus a result.
7. Request foreground permission and show the device location.
8. Search local place data and focus a result.

Part 8 builds on Parts 3 and 6: leave `selection` and `camera` enabled so a search result can show details and move the map. No feature needs to be disabled when moving to a later part.

## Tests and checks

```sh
npm run check-progress:report # report starter progress without failing
npm run test:infrastructure  # setup, docs, and progress-checker tests
npm run check-progress      # fail while a lesson is incomplete
npm test                    # feature and mocked service tests
npm run lint
npm run typecheck
npm run verify               # lint, typecheck, progress, and all tests
```

Unit tests mock `react-native-maps` and the location service. They make no map API requests and never read device location. Manually verify the live map and permission prompt on at least one iOS or Android device/emulator.

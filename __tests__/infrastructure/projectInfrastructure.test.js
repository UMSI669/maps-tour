const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const root = path.resolve(__dirname, '../..');

test('project scripts provide report-only progress and infrastructure checks', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  expect(packageJson.scripts['check-progress:report']).toBeDefined();
  expect(packageJson.scripts['test:infrastructure']).toBeDefined();
  expect(packageJson.scripts['android:build']).toBe('expo run:android');
  expect(packageJson.scripts.start).toBe('expo start --go');
  expect(packageJson.scripts['start:dev-client']).toBe('expo start --dev-client');
  expect(packageJson.scripts['start:expo-go']).toBe('expo start --go');
  expect(packageJson.scripts.verify).toContain('check-progress');
});

test('progress checker parses active TSX and reports each guided part', () => {
  const output = execFileSync(process.execPath, ['scripts/check-progress.js', '--report-only'], {
    cwd: root,
    encoding: 'utf8',
  });
  expect(output).toContain('Maps Tour Progress');
  expect(output).toContain('PART 8 — SEARCH AND FOCUS PLACES');
  expect(output).toMatch(/Report-only mode|8 of 8 parts complete/);
});

test('README documents SDK-compatible install and native map setup', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  expect(readme).toContain('npx expo install react-native-maps expo-location');
  expect(readme).toContain('Expo Go');
  expect(readme).toContain('Google Cloud');
  expect(readme).toContain('Ann Arbor');
  expect(readme).toContain('EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY');
  expect(readme).toContain('android/app/debug.keystore');
  expect(readme).not.toContain('~/.android/debug.keystore');
  expect(readme).toContain('https://drive.google.com/file/d/1H0xno7wLBqRSyFQxEBHb0t2-ICpYSCPI/view?usp=drive_link');
  expect(readme).toContain('drag the APK file onto the emulator window');
});

test('environment template is tracked while the regular local env file is ignored', () => {
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  expect(example).toContain('EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=');
  expect(example).not.toContain('EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=');
  expect(gitignore).toContain('.env');
  expect(gitignore).toContain('!.env.example');
});

test('custom native map config accepts Expo-public API key names', () => {
  const names = [
    'EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY',
    'EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY',
    'GOOGLE_MAPS_ANDROID_API_KEY',
    'GOOGLE_MAPS_IOS_API_KEY',
  ];
  const original = Object.fromEntries(names.map(name => [name, process.env[name]]));

  try {
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY = 'android-test-key';
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY = 'ios-test-key';
    delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    delete process.env.GOOGLE_MAPS_IOS_API_KEY;

    const config = require('../../app.config.js')({ config: { plugins: [] } });
    const mapPlugin = config.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'react-native-maps');
    expect(mapPlugin[1]).toEqual({
      androidGoogleMapsApiKey: 'android-test-key',
      iosGoogleMapsApiKey: 'ios-test-key',
    });
  } finally {
    for (const name of names) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
  }
});

test('starter app parses and provides its safe area provider above the screen', () => {
  const appSource = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');
  const ast = parser.parse(appSource, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  let providerWrapsSafeArea = false;
  let flatListIsNestedInScrollView = false;

  traverse(ast, {
    JSXOpeningElement(pathRef) {
      if (pathRef.node.name.type !== 'JSXIdentifier' || pathRef.node.name.name !== 'SafeAreaView') return;
      let parent = pathRef.parentPath;
      while (parent) {
        if (parent.isJSXElement() && parent.node.openingElement.name.type === 'JSXIdentifier'
          && parent.node.openingElement.name.name === 'SafeAreaProvider') providerWrapsSafeArea = true;
        parent = parent.parentPath;
      }
    },
    JSXElement(pathRef) {
      if (pathRef.node.openingElement.name.type !== 'JSXIdentifier'
        || pathRef.node.openingElement.name.name !== 'FlatList') return;
      let parent = pathRef.parentPath;
      while (parent) {
        if (parent.isJSXElement() && parent.node.openingElement.name.type === 'JSXIdentifier'
          && parent.node.openingElement.name.name === 'ScrollView') flatListIsNestedInScrollView = true;
        parent = parent.parentPath;
      }
    },
  });

  expect(providerWrapsSafeArea).toBe(true);
  expect(flatListIsNestedInScrollView).toBe(false);
});

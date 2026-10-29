// Fonts and UI sounds, linked with `npx react-native-asset`: fonts go to both platforms;
// sounds are linked into the iOS bundle only, because Android plays them from res/raw
// (scripts/generate-sounds.mjs writes them there directly).
module.exports = {
  assets: ['./src/assets/fonts/'],
  iosAssets: ['./src/assets/sounds/'],
};

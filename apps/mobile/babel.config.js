module.exports = function(api) {
  // console.log("--- Loading apps/mobile/babel.config.js ---");
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};

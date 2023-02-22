const path = require('path');
const pkg = require('../package.json');

module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // console.log("HELLO!?=?!")
    // Make whatever fine-grained changes you need
    const keys = Object.keys(pkg.devDependencies).filter((s) => s && s.startsWith("prosemirror"))
    // console.log(keys)
    const prosemirrorDeps = {};
    for (const dep of keys) {
      // console.log(`Absoluting dependency ${dep}`)
      prosemirrorDeps[`${dep}`] = path.resolve(__dirname, `../node_modules/${dep}`);
    }
    console.log(config.resolve)
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        ...prosemirrorDeps
      }
    }
    console.log(config.resolve)

    // Return the altered config
    return config;
  },
}
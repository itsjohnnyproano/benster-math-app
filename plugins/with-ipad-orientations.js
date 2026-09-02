const { withInfoPlist } = require("expo/config-plugins");

const PHONE_ORIENTATIONS = [
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
];

const IPAD_ORIENTATIONS = [
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
];

module.exports = function withIpadOrientations(config) {
  return withInfoPlist(config, (configuredProject) => {
    configuredProject.modResults.UISupportedInterfaceOrientations = PHONE_ORIENTATIONS;
    configuredProject.modResults["UISupportedInterfaceOrientations~ipad"] = IPAD_ORIENTATIONS;
    return configuredProject;
  });
};

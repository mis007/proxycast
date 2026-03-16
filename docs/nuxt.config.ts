export default {
  extends: ["docus"],
  app: {
    baseURL: "/lime/",
  },
  image: {
    provider: "none",
  },
  robots: {
    robotsTxt: false,
  },
  llms: {
    domain: "https://lime.local",
  },
};

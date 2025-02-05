/**
 * @typedef {Object} Config
 * @property {string} repositoryName
 * @property {string} accessToken
 * @property {string} permanentToken
 * @property {Object[]} routes
 */
export default {
  /**
   * From your repository URL, the subdomain (e.g. the part before .prismic.io)
   * is the repository name
   *
   * {@link https://prismic.io/docs/guides/repository}
   */
  repositoryName: "",

  /**
   * In your repository, go to Settings > API & Security > Generate an Access Token
   *
   * {@link https://prismic.io/docs/access-token}
   */
  accessToken: "",

  /**
   * In your repository, go to Settings > API & Security > Write APIs > Add a token
   *
   * {@link https://prismic.io/docs/custom-types-api#permanent-token-recommended}
   */
  permanentToken: "",

  /**
   * Update to match your website's URL structure. If not provided, exported
   * documents will have an empty `url` property
   *
   * {@link https://prismic.io/docs/route-resolver}
   */
  routes: [
    // { type: "page", path: "/", uid: "home" },
    // { type: "page", path: "/:uid" },
  ],
};

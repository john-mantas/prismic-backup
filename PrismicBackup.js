import * as prismic from "@prismicio/client";
import fs from "fs-extra";
import path from "path";

import { Logger } from "./Logger.js";

/**
 * PrismicBackup class provides methods to backup a Prismic repository
 */
export class PrismicBackup {
  #ASSETS_API = "https://asset-api.prismic.io/assets";
  #CUSTOM_TYPES_API = "https://customtypes.prismic.io/customtypes";
  #SLICES_API = "https://customtypes.prismic.io/slices";

  #config;
  #client;
  #logger;
  #failedAssets = [];
  #root = "";

  /**
   * Creates an instance of PrismicBackup
   *
   * @constructor
   * @param {Config} config - The configuration object
   */
  constructor(config) {
    this.#config = config;
    this.#client = prismic.createClient(config.repositoryName, {
      routes: config.routes,
      accessToken: config.accessToken,
    });
    this.#logger = new Logger();
    this.#root = this.#createExportPath("");
  }

  /**
   * Creates a full export path for a given relative path
   *
   * @private
   * @param {string} p - The relative path
   * @returns {string} The combined export path
   */
  #createExportPath(p) {
    return path.join("./", this.#config.repositoryName, p);
  }

  /**
   * Performs a fetch request with authentication headers
   *
   * @private
   * @param {string} url - The URL to fetch data from
   * @returns {Promise<Response>} A promise that resolves to the fetch response
   */
  #authenticatedFetch(url) {
    return fetch(url, {
      headers: {
        repository: this.#config.repositoryName,
        authorization: `Bearer ${this.#config.permanentToken}`,
      },
    });
  }

  /**
   * Logs the list of failed assets to a JSON file
   *
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async #logFailedAssets() {
    try {
      if (this.#failedAssets.length === 0) return;

      await fs.ensureDir(this.#root);
      const logPath = this.#createExportPath("failed-assets.json");
      await fs.outputJson(logPath, this.#failedAssets);
      this.#logger.info(
        `Created failed assets log: ${this.#failedAssets.length} ${this.#failedAssets.length > 1 ? "failures" : "failure"} recorded at ${logPath}`,
      );
    } catch (error) {
      this.#logger.error(`Failed to save failed assets log: ${error.message}`);
    }
  }

  /**
   * Exports repository metadata such as refs, languages, releases etc.
   *
   * @async
   * @returns {Promise<Object>} The repository metadata object
   */
  async exportRepositoryDetails() {
    try {
      const repo = await this.#client.getRepository();

      if (!repo) {
        this.#logger.warn("No repository found - skipping export");
        return;
      }

      await fs.ensureDir(this.#root);
      const repoPath = this.#createExportPath("repository.json");
      await fs.outputJson(repoPath, repo);
      this.#logger.info(`Exported repository metadata to ${repoPath}`);

      return repo;
    } catch (error) {
      this.#logger.error(`Repository metadata export failed: ${error.message}`);
    }
  }

  /**
   * Exports all documents from the repository into a single JSON file and
   * additionally creates separate JSON files grouped by document type
   *
   * @async
   * @returns {Promise<Object[]>} The array of all documents retrieved from the
   *                              repository
   */
  async exportDocuments() {
    try {
      const allDocs = await this.#client.dangerouslyGetAll();
      if (allDocs && allDocs.length === 0) {
        this.#logger.warn(
          "No documents found in repository - skipping document export",
        );
        return;
      }

      // Create a single JSON file containing all documents
      await fs.ensureDir(this.#root);
      const docsPath = this.#createExportPath("documents.json");
      await fs.outputJson(docsPath, allDocs);
      this.#logger.info(`Exported ${allDocs.length} documents to ${docsPath}`);

      // Create separate JSON files for each document type
      const types = allDocs.reduce((acc, doc) => {
        (acc[doc.type] = acc[doc.type] || []).push(doc);
        return acc;
      }, {});

      const typesDest = this.#createExportPath("documents");
      await Promise.all(
        Object.entries(types).map(async ([type, docs]) => {
          const typePath = path.join(typesDest, `${type}.json`);
          await fs.outputJson(typePath, docs);
        }),
      );

      this.#logger.info(
        `Exported documents by type (${Object.keys(types).length} types) to ${typesDest}`,
      );

      return allDocs;
    } catch (error) {
      this.#logger.error(`Documents export failed: ${error.message}`);
    }
  }

  /**
   * Fetches and exports all tags from the Prismic repository into a text file
   *
   * @async
   * @returns {Promise<string[]>} The array of tags
   */
  async exportTags() {
    try {
      const tags = await this.#client.getTags();
      if (tags && tags.length < 1) {
        this.#logger.warn("No tags found in repository - skipping tag export");
        return;
      }

      await fs.ensureDir(this.#root);
      const tagsPath = this.#createExportPath("tags.txt");
      await fs.writeFile(tagsPath, tags.join("\n"));
      this.#logger.info(`Exported ${tags.length} tags to ${tagsPath}`);

      return tags;
    } catch (error) {
      this.#logger.error(`Tags export failed: ${error.message}`);
    }
  }

  /**
   * Retrieves custom types from the Prismic custom types API and exports them
   * as a JSON file
   *
   * @async
   * @returns {Promise<Object[]>} The list of custom types
   */
  async exportCustomTypes() {
    try {
      const response = await this.#authenticatedFetch(this.#CUSTOM_TYPES_API);

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status} ${response.statusText}`,
        );
      }

      const customTypes = await response.json();
      await fs.ensureDir(this.#root);
      const assetsPath = this.#createExportPath("custom-types.json");
      await fs.outputJson(assetsPath, customTypes);
      this.#logger.info(
        `Exported ${customTypes.length} custom types to ${assetsPath}`,
      );

      return customTypes;
    } catch (error) {
      this.#logger.error(`Custom types export failed: ${error.message}`);
    }
  }

  /**
   * Retrieves shared slices from the Prismic slices API and exports them as a
   * JSON file
   *
   * @async
   * @returns {Promise<Object[]>} The list of shared slices
   */
  async exportSharedSlices() {
    try {
      const response = await this.#authenticatedFetch(this.#SLICES_API);

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status} ${response.statusText}`,
        );
      }

      const sharedSlices = await response.json();

      if (sharedSlices && sharedSlices.length === 0) {
        this.#logger.warn(
          "No shared slices found in repository - skipping slices export",
        );
        return;
      }

      await fs.ensureDir(this.#root);
      const assetsPath = this.#createExportPath("shared-slices.json");
      await fs.outputJson(assetsPath, sharedSlices);
      this.#logger.info(
        `Exported ${sharedSlices.length} shared slices to ${assetsPath}`,
      );

      return sharedSlices;
    } catch (error) {
      this.#logger.error(`Shared slices export failed: ${error.message}`);
    }
  }

  /**
   * Retrieves a complete list of assets from the repository using the Prismic
   * assets API, handling pagination, and exports the list to a JSON file
   *
   * @async
   * @returns {Promise<Object[]>} The list of assets
   */
  async exportAssetsList() {
    try {
      const assetApi = new URL(`${this.#ASSETS_API}?limit=1000`);
      const items = [];
      let cursor = null;

      while (true) {
        if (cursor) {
          assetApi.searchParams.set("cursor", cursor);
        }

        const response = await this.#authenticatedFetch(assetApi);

        if (!response.ok) {
          throw new Error(
            `API returned ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        items.push(...data.items);

        if (!data.cursor) break;
        cursor = data.cursor;
      }

      await fs.ensureDir(this.#root);
      const assetsPath = this.#createExportPath("assets.json");
      await fs.outputJson(assetsPath, items);
      this.#logger.info(`Exported ${items.length} assets to ${assetsPath}`);

      return items;
    } catch (error) {
      this.#logger.error(`Assets list export failed: ${error.message}`);
    }
  }

  /**
   * Downloads a single asset and saves it to the specified destination folder
   *
   * @async
   * @param {Object} asset - The asset object containing at least a URL and filename
   * @param {string} dest - The destination folder where the asset should be saved
   * @returns {Promise<void>}
   */
  async downloadAsset(asset, dest) {
    // Remove all url params
    const assetUrl = asset.url.split("?")[0];
    // Use the asset "url" to match assets with the url linked in documents
    const hashedFilename = decodeURIComponent(assetUrl.split("/").pop());

    try {
      const response = await fetch(assetUrl);

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status} ${response.statusText}`,
        );
      }

      const buffer = await response.arrayBuffer();
      await fs.ensureDir(dest);
      await fs.writeFile(path.join(dest, hashedFilename), Buffer.from(buffer));
      this.#logger.info(`Downloaded "${asset.filename}" to ${dest}`);
    } catch (error) {
      this.#failedAssets.push(asset);
      this.#logger.error(
        `Failed to download "${asset.filename}": ${error.message}`,
      );
    }
  }

  /**
   * Downloads all assets from the repository in batches, ensuring that failures
   * are logged and the list of failed downloads is exported
   *
   * @async
   * @param {Array} [assets] - An optional list of assets. If not provided, the
   *                           method will fetch the list using exportAssetsList()
   * @returns {Promise<void>}
   */
  async downloadAssets(assets) {
    try {
      if (!assets) {
        this.#logger.info("No assets provided, fetching assets list...");
        assets = await this.exportAssetsList();

        // No assets returned from exportAssetsList()
        if (assets === undefined) return;
      }

      if (assets && assets.length === 0) {
        this.#logger.warn(
          "No assets found in repository - skipping assets export",
        );
        return;
      }

      const ASSETS_FOLDER = this.#createExportPath("assets");
      const BATCH_SIZE = 10;

      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batch = assets.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((asset) => this.downloadAsset(asset, ASSETS_FOLDER)),
        );
      }

      await this.#logFailedAssets();

      const successCount = assets.length - this.#failedAssets.length;
      this.#logger.info(
        `Downloaded ${successCount}/${assets.length} assets successfully`,
      );
    } catch (error) {
      this.#logger.error(`Assets download process failed: ${error.message}`);
    }
  }

  /**
   * Runs the complete backup process concurrently, including exporting
   * documents, tags, custom types, shared slices, and downloading assets
   *
   * @async
   * @returns {Promise<void>}
   */
  async run() {
    this.#logger.info(`Backup started...`);
    const startTime = performance.now();

    const tasks = [
      this.exportRepositoryDetails(),
      this.exportDocuments(),
      this.exportTags(),
      this.exportCustomTypes(),
      this.exportSharedSlices(),
      this.downloadAssets(),
    ];

    await Promise.all(tasks);

    const duration = ((performance.now() - startTime) / 1000).toFixed(3);
    this.#logger.info(`Backup completed in ${duration}s`);
  }
}

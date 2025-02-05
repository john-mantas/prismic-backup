import { PrismicBackup } from "./PrismicBackup.js";
import config from "./config.js";

const backup = new PrismicBackup(config);

await backup.run();

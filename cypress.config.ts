import { defineConfig } from "cypress";
import { config } from "dotenv";

config();

export default defineConfig({
  projectId: "akcz6v",
  reporter: "junit",
  retries: {
    runMode: 2,
    openMode: 1,
  },
  e2e: {
    experimentalStudio: true,
    viewportHeight: 1000,
    viewportWidth: 1280,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  env: {
    auth0_username: process.env.AUTH0_USERNAME,
    auth0_password: process.env.AUTH0_PASSWORD,
    auth0_domain: process.env.AUTH0_DOMAIN,
    auth0_audience: process.env.AUTH0_AUDIENCE,
    auth0_scope: process.env.AUTH0_SCOPE,
    auth0_client_id: process.env.AUTH0_CLIENT_ID,
  },
});

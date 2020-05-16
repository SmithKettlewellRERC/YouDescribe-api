// Imports the Google Cloud client library
const {Storage} = require("@google-cloud/storage");

// Creates a client from a Google service account key.
const storage = new Storage({
  keyFilename: "shared/youdescribe-stats-846041efde0c.json",
  projectId: "youdescribe-stat-1569864136126",
});

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const bucketName = 'youdescribe';

async function createBucket() {
  // Creates the new bucket
  await storage.createBucket(bucketName);
  console.log(`Bucket ${bucketName} created.`);
}

createBucket();
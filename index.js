const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration for different NFT collections
const COLLECTION_HANDLERS = {
  sappyseals: {
    type: "ipfs",
    baseUrl: "ipfs://QmXUUXRSAJeb4u8p4yKHmXN1iAKtAV7jwLHjw35TNm5jN7/",
  },
  omniapets: {
    type: "api",
    baseUrl: "https://www.omnia.lol/api/pixlpets/",
  },
};

// List of IPFS gateways for failover
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

// Fetch metadata from IPFS gateways
const fetchFromGateways = async (cid, path) => {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cid}/${path}`;
      console.log(`Trying gateway: ${url}`);
      const response = await axios.get(url);
      console.log(`Success: Metadata fetched successfully from ${url}`);
      return response.data;
    } catch (error) {
      console.log(`Failed at gateway: ${gateway}`);
    }
  }
  throw new Error("All IPFS gateways failed");
};

// Fetch metadata from an API
const fetchFromApi = async (baseUrl, id) => {
  const url = `${baseUrl}${id}`;
  console.log(`Fetching metadata from API: ${url}`);
  const response = await axios.get(url);
  console.log(`Success: Metadata fetched successfully from ${url}`);
  return response.data;
};

// Generic function to handle metadata fetching
const fetchMetadata = async (collection, id) => {
  const handler = COLLECTION_HANDLERS[collection.toLowerCase()];
  if (!handler) {
    throw new Error(`Collection '${collection}' not found`);
  }

  if (handler.type === "ipfs") {
    // Extract CID and path for IPFS collections
    const [cid, ...pathParts] = handler.baseUrl.replace("ipfs://", "").split("/");
    const path = [id, ...pathParts].join("/");
    return await fetchFromGateways(cid, path);
  } else if (handler.type === "api") {
    // Use API base URL for API-based collections
    return await fetchFromApi(handler.baseUrl, id);
  } else {
    throw new Error(`Unknown handler type for collection '${collection}'`);
  }
};

// Endpoint: /nft/:collection/:id
app.get('/nft/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;

  try {
    const metadata = await fetchMetadata(collection, id);
    console.log(`Successfully fetched metadata for ${collection} ID ${id}`);
    res.status(200).json(metadata);
  } catch (error) {
    console.error(`Error fetching metadata for ${collection} ID ${id}:`, error.message);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unable to fetch data. Please check the ID or try again later." });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`NFT Info API running on port ${PORT}`);
});

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// NFT collections and IPFS base URLs
const COLLECTIONS = {
  sappyseals: "ipfs://QmXUUXRSAJeb4u8p4yKHmXN1iAKtAV7jwLHjw35TNm5jN7/",
  differentNFTcollection: "ipfs://QmSomeOtherBaseURLHere/"
};

// List of IPFS gateways for failover
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/"
];

// Function to fetch from multiple gateways
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

// Endpoint: /nft/:collection/:id
app.get('/nft/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;

  const baseIpfsUrl = COLLECTIONS[collection.toLowerCase()];
  if (!baseIpfsUrl) {
    return res.status(404).json({ error: `Collection '${collection}' not found` });
  }

  // Parse CID and path
  const [cid, ...pathParts] = baseIpfsUrl.replace("ipfs://", "").split("/");
  const path = [id, ...pathParts].join("/");

  try {
    const metadata = await fetchFromGateways(cid, path);
    console.log(`Successfully fetched metadata for ${collection} ID ${id}`);
    res.status(200).json(metadata);
  } catch (error) {
    console.error(`Error fetching metadata:`, error.message);
    res.status(500).json({ error: "Unable to fetch data. Please check the ID or try again later." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`NFT Info API running on port ${PORT}`);
});

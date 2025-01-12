const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Base IPFS URL for Sappy Seals
const BASE_IPFS_URL = "ipfs://QmXUUXRSAJeb4u8p4yKHmXN1iAKtAV7jwLHjw35TNm5jN7/";

// List of public IPFS gateways (use as fallback if needed)
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/"
];

// Middleware to handle errors gracefully
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Utility function to fetch data from IPFS
const fetchFromIPFS = async (id) => {
  // Generate IPFS path
  const ipfsPath = BASE_IPFS_URL.replace("ipfs://", "") + id;

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${ipfsPath}`;
      const response = await axios.get(url);
      return response.data; // Return data if fetched successfully
    } catch (error) {
      console.error(`Error fetching from gateway ${gateway}:`, error.message);
      // Continue to the next gateway in case of failure
    }
  }

  throw new Error("Unable to fetch data from all IPFS gateways.");
};

// Endpoint: /sappyseals/:id
app.get('/sappyseals/:id', async (req, res) => {
  const { id } = req.params;

  // Validate the ID to ensure it's numeric
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid ID format. ID must be a numeric value." });
  }

  try {
    const data = await fetchFromIPFS(id);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: "Unable to fetch data. Please check the ID or try again later." });
  }
});

// Handle invalid routes
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

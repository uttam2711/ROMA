const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Serve Angular dist folder
app.use(express.static(path.join(__dirname, "dist/roma/browser")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/roma/browser/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

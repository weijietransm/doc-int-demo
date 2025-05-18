const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Optional: Add routes for API proxying if you want to hide the API keys
// app.post('/api/analyze', upload.single('file'), async (req, res) => {
//   // Handle document analysis here to avoid exposing API keys in the client
// });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

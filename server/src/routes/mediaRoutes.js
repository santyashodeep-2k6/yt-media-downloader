const express = require('express');
const router = express.Router();
const mediaService = require('../services/mediaService');

router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const info = await mediaService.analyzeMedia(url);
    res.json(info);
  } catch (error) {
    console.error('Analyze Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze media' });
  }
});

router.post('/download', async (req, res) => {
  try {
    const { url, format, quality } = req.body;
    if (!url || !format) {
      return res.status(400).json({ error: 'URL and format are required' });
    }
    
    // Pass socket io instance to service to report progress
    const downloadId = await mediaService.startDownload({ 
      url, 
      format, 
      quality, 
      io: req.io 
    });
    
    res.json({ success: true, downloadId, message: 'Download started' });
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({ error: error.message || 'Failed to start download' });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const file = await mediaService.getFile(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found or still processing' });
    }
    res.download(file.path, file.filename);
  } catch (error) {
    console.error('File Error:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

module.exports = router;

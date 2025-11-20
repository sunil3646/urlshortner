const Link = require('../models/Link');

// Helper: Generate random code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// POST /api/links - Create a new short link
exports.createLink = async (req, res) => {
  try {
    let { target, code } = req.body;

    // 1. Validate Target URL format
    try {
      new URL(target);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // 2. Handle Custom Code or Generate New One
    if (code) {
      // Regex Check
      if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
        return res.status(400).json({ error: 'Code must be 6-8 alphanumeric characters.' });
      }
      // Check Duplicate
      const existing = await Link.findOne({ code });
      if (existing) {
        // MUST return 409 per spec
        return res.status(409).json({ error: 'Code already in use.' });
      }
    } else {
      // Generate unique code
      let isUnique = false;
      while (!isUnique) {
        code = generateCode();
        const existing = await Link.findOne({ code });
        if (!existing) isUnique = true;
      }
    }

    // 3. Create and Save
    const newLink = await Link.create({ code, target });
    res.status(201).json(newLink);

  } catch (error) {
    res.status(500).json({ error: 'Server Error', details: error.message });
  }
};

// GET /api/links - List all links
exports.getAllLinks = async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.status(200).json(links);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// GET /api/links/:code - Get Stats
exports.getLinkStats = async (req, res) => {
  try {
    const link = await Link.findOne({ code: req.params.code });
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.status(200).json(link);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// DELETE /api/links/:code - Delete Link
exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findOneAndDelete({ code: req.params.code });
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.status(200).json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// GET /:code - Redirect Logic
exports.redirectLink = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Atomic update: Increment clicks, set lastClicked
    const link = await Link.findOneAndUpdate(
      { code },
      { 
        $inc: { clicks: 1 }, 
        $set: { lastClicked: new Date() } 
      },
      { new: true }
    );

    if (!link) {
      return res.status(404).send('404 - Link Not Found');
    }

    // HTTP 302 Redirect per spec
    res.redirect(302, link.target);

  } catch (error) {
    res.status(500).send('Server Error');
  }
};
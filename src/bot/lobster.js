const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function processMessage(content, userId, platform) {
  try {
    const response = await axios.post(`${API_URL}/api/chat`, {
      message: content,
      userId,
      platform
    });
    return response.data.reply || 'No response from server.';
  } catch (error) {
    console.error(`[${platform}] API error:`, error.message);
    throw error;
  }
}

async function getStatus() {
  try {
    const response = await axios.get(`${API_URL}/api/status`);
    return response.data;
  } catch {
    return { status: 'offline' };
  }
}

module.exports = { processMessage, getStatus };

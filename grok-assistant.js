const { Grok } = require('xai-grok-client');

const grok = new Grok({
  apiKey: process.env.GROK_API_KEY,
  model: 'grok-1'
});

async function getGrokResponse(prompt) {
  try {
    const response = await grok.complete(prompt);
    return response;
  } catch (error) {
    console.error('Error con Grok:', error);
    return null;
  }
}

module.exports = { getGrokResponse };
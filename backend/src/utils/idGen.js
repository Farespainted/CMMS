const { customAlphabet } = require('nanoid');

const nanoidNum = customAlphabet('0123456789', 5);

// Generates a short, human-friendly, effectively-unique business number, e.g. WO-83920.
function generateCode(prefix) {
  return `${prefix}-${nanoidNum()}`;
}

module.exports = { generateCode };

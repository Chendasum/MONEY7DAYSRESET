const path = require('path');

// Determine the correct path to IMPERIUM-VAULT-SYSTEM
const VAULT_SYSTEM_PATH = process.env.VAULT_SYSTEM_PATH || '../../IMPERIUM-VAULT-SYSTEM';

module.exports = {
    VAULT_SYSTEM_PATH,
    AI_MODULES: {
        dualAISystem: path.join(VAULT_SYSTEM_PATH, 'utils/dualAISystem'),
        claudeClient: path.join(VAULT_SYSTEM_PATH, 'utils/claudeClient'),
        openaiClient: path.join(VAULT_SYSTEM_PATH, 'utils/openaiClient'),
        cashFlowOptimizer

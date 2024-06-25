const { ManagementClient } = require('auth0');

const management = new ManagementClient({
  domain: process.env.DOMAIN,
  clientId: process.env.MGMT_CLIENT_ID,
  clientSecret: process.env.MGMT_CLIENT_SECRET,
  scope: 'read:users'
});

// Get MFA factors
const getMFAFactors = async (userId) => {
  try {
    const factors = await management.users.getAuthenticationMethods({ id: userId });
    return factors;
  } catch (error) {
    console.error('Error fetching MFA factors:', error);
    throw error;
  }
};

// Delete MFA factor
const deleteMFAFactor = async (userId, authenticatorId) => {
  try {
    await management.users.deleteAuthenticationMethod({ id: userId, authentication_method_id: authenticatorId });
  } catch (error) {
    console.error('Error deleting MFA factor:', error);
    throw error;
  }
};

module.exports = {
  getMFAFactors,
  deleteMFAFactor
};
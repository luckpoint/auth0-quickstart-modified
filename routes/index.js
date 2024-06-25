const router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');
const { getMFAFactors, deleteMFAFactor } = require('../services/auth0ManagementService');

// Home route
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Auth0 Webapp sample Nodejs',
    isAuthenticated: req.oidc.isAuthenticated()
  });
});

// Extract phone numbers from MFA factors
function extractPhoneNumbers(data) {
  return data
    .filter(item => item.type === 'phone' && item.phone_number)
    .map(item => ({
      id: item.id,
      phone_number: item.phone_number
    }));
}

// Profile display route
router.get('/profile', requiresAuth(), async (req, res) => {
  console.log("GET /profile");
  try {
    const factors = await getMFAFactors(req.oidc.user.sub);
    const phoneNumbers = extractPhoneNumbers(factors.data);
    const phoneNumber = phoneNumbers.length ? phoneNumbers[0].phone_number : null;
    const authenticatorId = phoneNumbers.length ? phoneNumbers[0].id : null;

    // in case of deletion of phone factor
    req.session.authenticatorId = authenticatorId;
    const csrfToken = req.csrfToken();

    res.render('profile', {
      userProfile: JSON.stringify(req.oidc.user, null, 2),
      title: 'Profile page',
      phoneNumber: phoneNumber,
      csrfToken: csrfToken
    });
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Profile update route (add/delete phone number)
router.post('/profile', requiresAuth(), async (req, res) => {
  console.log("POST /profile");
  const action = req.body.action;
  console.log(`action=${action} authenticatorId=${req.session.authenticatorId}`);

  try {
    if (action === 'delete' && req.session.authenticatorId) {
      await deleteMFAFactor(req.oidc.user.sub, req.session.authenticatorId);
      res.redirect('/profile');
    } else if (action === 'add') {
      res.redirect(`/login?returnTo=http://localhost:${process.env.PORT}/profile`);
    } else {
      res.status(400).send('Invalid action');
    }
  } catch (error) {
    console.error('Error processing profile update:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;

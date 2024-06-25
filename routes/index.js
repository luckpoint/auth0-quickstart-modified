const dotenv = require('dotenv');
const { ManagementClient } = require('auth0');
var router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');
dotenv.load();

const management = new ManagementClient({
  domain: process.env.DOMAIN,
  clientId: process.env.MGMT_CLIENT_ID,
  clientSecret: process.env.MGMT_CLIENT_SECRET,
  scope: 'read:users'
});

// MFA取得
const getMFAFactors = async (userId) => {
  try {
    const factors = await management.users.getAuthenticationMethods({ id: userId });
    return factors
  } catch (error) {
    console.error('Error fetching MFA factors:', error);
  }
};

// MFA削除
const deleteMFAFactor = async (userId, authenticatorId) => {
  try {
    await management.users.deleteAuthenticationMethod({ id: userId, authentication_method_id: authenticatorId });
  } catch (error) {
    console.error('Error fetching MFA factors:', error);
  }
};

router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Auth0 Webapp sample Nodejs',
    isAuthenticated: req.oidc.isAuthenticated()
  });
});

function extractPhoneNumbers(data) {
  return data
    .filter(item => item.type === 'phone' && item.phone_number)
    .map(item => ({
      id: item.id,
      phone_number: item.phone_number
    }));
}

// プロフィール表示処理
router.get('/profile', requiresAuth(), async function(req, res, next) {
  console.log("GET /profile")
  const factors = await getMFAFactors(req.oidc.user.sub);
  console.log(factors.data)
  const phoneNumbers = extractPhoneNumbers(factors.data);
  let phoneNumber;
  let authenticatorId;
  if (phoneNumbers) {
    phoneNumber = phoneNumbers[0].phone_number;
    authenticatorId = phoneNumbers[0].phone_number;
  }
  req.session.authenticatorId = authenticatorId
  const csrfToken = req.csrfToken();

  res.render('profile', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Profile page',
    phoneNumber: phoneNumber,
    csrfToken: csrfToken
  });
});

// プロフィール（電話番号追加・削除処理）
router.post('/profile', requiresAuth(), async function(req, res, next) {
  console.log("POST /profile")
  const action = req.body.action;
  console.log(`actiion=${action} authenticatorId=${req.session.authenticatorId} `)
  if (action === 'delete') {
    // 電話番号の削除ロジック
    if (req.session.authenticatorId) {
      deleteMFAFactor(req.oidc.user.sub, req.session.authenticatorId)
    }
    res.redirect('/profile');
  } else if (action === 'add') {
    // 電話番号の追加ロジック
    res.redirect(`/login?returnTo=http://localhost:${process.env.PORT}/profile`)
  }

});

module.exports = router;

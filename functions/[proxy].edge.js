import jwt from '@tsndr/cloudflare-worker-jwt';

export default async function handler(request, context) {
  const oauthCredentials = {
    OAUTH_CLIENT_ID: context.env.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: context.env.OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URI: context.env.OAUTH_REDIRECT_URI,
    OAUTH_TOKEN_URL: context.env.OAUTH_TOKEN_URL
  };
  
  if (request.url.includes('_next') || request.url.includes('favicon.ico')) {
    return fetch(request);
  }

  if (request.url.includes('/login')) {
      console.log('login request')
    return fetch(request);
  }
  const clonedHeaders = new Headers(request.headers);
  console.log('edge header', clonedHeaders.get('x-launch-deploymentuid'))
  clonedHeaders.set('x-launch-deploymentuid', 'something');
  request = new Request(request.url, {
		...request,
		headers: new Headers(clonedHeaders),
	});
  if (request.url.includes('/oauth/callback')) {
    const authCode = new URL(request.url).searchParams.get('code');
    if (authCode) {
      const tokens = await exchangeAuthCodeForTokens(authCode, oauthCredentials);
      const jwtToken = await createJwtToken(tokens, oauthCredentials);
      const response = redirectTo('/');
      const modifiedResponse = setCookie(response, 'jwt', jwtToken);
      console.log(JSON.stringify({condition: 'if',jwtToken, url: request.url, method: request.method, authCode, responseStatus:modifiedResponse.status}))
      
      return modifiedResponse;
    }
    
      console.log(JSON.stringify({'condition':'not if',url: request.url, method: request.method}));
  }

  const cookies = parseCookies(request.headers.get('cookie') || '');
  const jwtToken = cookies['jwt'];

  if (jwtToken) {
    
      console.log('jwt token present');
    try {
      const verified = await jwt.verify(jwtToken, oauthCredentials.OAUTH_CLIENT_SECRET);
      if (verified) {
        console.log('verified');
        return fetch(request);
      } else {
        
        console.log('not verified');
        const decoded = jwt.decode(jwtToken);
        if (decoded.payload.exp < timeNow()) {
          
          console.log('exxp > now');
          const newToken = await refreshJwtToken(decoded.payload.refreshToken, oauthCredentials);

          const response = await fetch(request);
          const modifiedResponse = setCookie(response, 'jwt', newToken);
          return modifiedResponse;
        }
      }
    } catch (err) {
      console.log(err);
      return redirectToLogin();
    }
  }
      console.log(JSON.stringify({condition: 'not jwt in cookie', url: request.url, method: request.method}))
      
  return redirectToLogin();
}

function parseCookies(cookieString) {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=').map(c => c.trim());
    acc[key] = value;
    return acc;
  }, {});
}

function setCookie(response, name, value) {
  const modifiedResponse = new Response(response.body, response);
  modifiedResponse.headers.set('Set-Cookie', `${name}=${value}; Path=/; HttpOnly`);
  return modifiedResponse;
}

function redirectToLogin() {
  return redirectTo('/login');
}

function timeNow() {
  return Math.floor(Date.now() / 1000);
}

function redirectTo(path) {
  const response = new Response(undefined, {
    status: 307,
    headers: {
      'Location': path
    }
  });
  return response;
}

async function exchangeAuthCodeForTokens(authCode, oauthCredentials) {
  const response = await fetch(oauthCredentials.OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: oauthCredentials.OAUTH_CLIENT_ID,
      client_secret: oauthCredentials.OAUTH_CLIENT_SECRET,
      code: authCode,
      redirect_uri: oauthCredentials.OAUTH_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  const tokens = response.json();
  if (!response.ok) {
    throw new Error(tokens);
  }

  return tokens;
}

async function createJwtToken({ access_token, refresh_token, expires_in }, oauthCredentials) {
  const exp = timeNow() + expires_in;
  return jwt.sign({ accessToken: access_token, refreshToken: refresh_token, exp }, oauthCredentials.OAUTH_CLIENT_SECRET);
}

async function refreshJwtToken(refreshToken, oauthCredentials) {
  const response = await fetch(oauthCredentials.OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: oauthCredentials.OAUTH_CLIENT_ID,
      client_secret: oauthCredentials.OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const tokens = await response.json();
  if (!response.ok) {
    throw new Error(tokens);
  }
  return createJwtToken(tokens, oauthCredentials);
}

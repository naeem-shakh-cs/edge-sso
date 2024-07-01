This is a Contentstack Launch example project demonstrating an example [edge function](https://www.contentstack.com/docs/developers/launch/edge-functions) use case. In this example, the website is protected with Contentstack's [OAuth](https://www.contentstack.com/docs/developers/developer-hub/contentstack-oauth) as a Single Sign On (SSO). This means access to the website is granted only if you have access to the right Contentstack organization.

## Tech stack
- Next.js 14
- Launch edge functions
- [JWT](https://jwt.io/)

## Getting Started

First, create an OAuth application on Contentstack using DeveloperHub. The type of the app should be ["Organization"](https://www.contentstack.com/docs/developers/developer-hub/types-of-apps#organization-apps). Follow instructions in the [documentation](https://www.contentstack.com/docs/developers/developer-hub/contentstack-oauth#integrate-your-apps-with-contentstack-oauth) to create the app.

After creating the app, add `user.profile:read` as the scope for the user token section. We do not need to add any scopes for the app token section. Save the app configuration.

Next, [deploy this repository](https://www.contentstack.com/docs/developers/launch/import-project-using-github) on Launch. Add the following environment variables when configuring the deployment:

```
OAUTH_CLIENT_ID=*** // copy Client ID from DeveloperHub
OAUTH_CLIENT_SECRET=*** // copy Client Secret from DeveloperHub
OAUTH_REDIRECT_URI=https://{project-name}.contentstackapps.com/oauth/callback // paste the project name
OAUTH_TOKEN_URL=https://app.contentstack.com/apps-api/apps/token
OAUTH_AUTHORIZE_URL=https://app.contentstack.com/apps/{app UID}/authorize // copy App UID from DeveloperHub
```

Keep in mind that depending on your [Contentstack Region](https://www.contentstack.com/docs/developers/contentstack-regions), you may need to use different base URLs for the above configuration.

Once the website is deployed, copy the value of the `OAUTH_REDIRECT_URI` environment variable and paste it in DeveloperHub's "Redirect URL" section in OAuth. Save the app.

Finally, you can open up the website and try out the flow. You will be shown a login screen initially, and after executing the login flow, you'll be taken to the website homepage.

## How it works

![Sequence Diagram](https://github.com/contentstack-launch-examples/edge-sso/blob/main/sequence-diagram.png?raw=true)

1. When accessing the webite for the first time, the edge function does not find a JWT. It responds with a redirection to the login page (`/login`).
2. Clicking on the login redirects the user to the CS OAuth authorization page (as defined by the `OAUTH_AUTHORIZE_URL` env variable). Here, the user needs to login to Contentstack and authorize the application to access the user profile information.

Once authorized, CS OAuth redirects back to the website (as defined by the Redirect URL field in the OAuth app) with the authorization code.

The edge function exchanges the code and client credentials to obtain the access and refresh tokens from the token URL (as defined by the `OAUTH_TOKEN_URL` env variable).

The token information, along with the expiry (set as per the expiry of the access token) is used to create JWT token. The token is signed with `OAUTH_CLIENT_SECRET` as the secret key. This JWT token is then dropped as a cookie in the response from the origin (the cookie name is `jwt`).

3. With the JWT cookie in hand, any requests made to the website is now validated by the edge function, and the request goes through to the server.
4. The JWT has an expiration period of an hour, which is equivalent to the expiration period of the access token. The edge function attempts to negotiate a new access/refresh token pair with the refresh token encoded in the JWT cookie. If successful, a new cookie is dropped, which contains the new access/refresh token pair.
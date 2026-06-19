import {
  BrowserCacheLocation,
  Configuration,
  LogLevel,
  PublicClientApplication,
} from "@azure/msal-browser";

const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "";
const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID || "";
const redirectUri =
  process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ||
  "http://localhost:3000/sso/callback";

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },

  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,

  },

  system: {
    loggerOptions: {
      loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
      ) => {
        if (containsPii) return;

        switch (level) {
          case LogLevel.Error:
            console.error("[MSAL]", message);
            break;
          case LogLevel.Warning:
            console.warn("[MSAL]", message);
            break;
          case LogLevel.Info:
            console.info("[MSAL]", message);
            break;
        }
      },
      logLevel: LogLevel.Info,
    },
  },
};

export const microsoftLoginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

let msalInstance: PublicClientApplication | null = null;

export const getMsalInstance = async (): Promise<PublicClientApplication> => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }

  return msalInstance;
};

import api from "@/app/lib/axios";
import axios from "@/app/lib/axios";
import rawAxios from "axios";
import { getMsalInstance, microsoftLoginRequest, msalConfig } from "@/app/lib/msalConfig";
import { PagePermission } from "@/app/lib/permission";

export interface MicrosoftSsoFrontendData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    role?: string;
    status?: string;
    accountStatus?: string;
    isPending?: boolean;
    isDenied?: boolean;
  };
  permissions?: PagePermission[];
  pagePermissions?: PagePermission[];
}

export interface MicrosoftSsoFrontendEnvelope {
  success: boolean;
  data: MicrosoftSsoFrontendData | null;
  message: string;
  error: string | null;
}

export interface MicrosoftCallbackResult {
  exchange: MicrosoftSsoFrontendEnvelope;
  idToken: string;
  idTokenClaims?: Record<string, unknown>;
  accessToken?: string;
}

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const ssoExchange = async (
  idToken: string
): Promise<MicrosoftSsoFrontendEnvelope> => {
  const baseURL = getApiBaseUrl();

  const response = await rawAxios.post(
    `${baseURL}/auth/sso/microsoft/exchange`,
    { idToken },
    {
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
      withCredentials: false,
    }
  );

  const payload = response.data as MicrosoftSsoFrontendEnvelope;

  if (!payload) {
    return {
      success: false,
      data: null,
      message: "SSO login failed",
      error: "Empty backend response",
    };
  }

  return payload;
};

export const loginWithMicrosoftPopup =
  async (): Promise<MicrosoftSsoFrontendEnvelope> => {
    const msalInstance = await getMsalInstance();
    const configuredRedirect = msalConfig.auth.redirectUri;
    const popupRedirectUri = typeof configuredRedirect === "string" ? configuredRedirect : undefined;

    let msalResponse;

    try {
      msalResponse = await msalInstance.loginPopup({
        ...microsoftLoginRequest,
        ...(popupRedirectUri ? { redirectUri: popupRedirectUri } : {}),
      });
    } catch (error: unknown) {
      const msalError = error as { errorCode?: string };
      if (msalError?.errorCode === "interaction_in_progress") {
        Object.keys(sessionStorage)
          .filter((key) => key.includes("interaction.status"))
          .forEach((key) => sessionStorage.removeItem(key));

        msalResponse = await msalInstance.loginPopup({
          ...microsoftLoginRequest,
          ...(popupRedirectUri ? { redirectUri: popupRedirectUri } : {}),
        });
      } else {
        throw error;
      }
    }

    if (!msalResponse?.idToken) {
      return {
        success: false,
        data: null,
        message: "SSO login failed",
        error: "ID token is missing from Microsoft response",
      };
    }

    return ssoExchange(msalResponse.idToken);
  };

export const loginWithMicrosoftRedirect = async (): Promise<void> => {
  const msalInstance = await getMsalInstance();

  Object.keys(sessionStorage)
    .filter((key) => key.includes("interaction.status"))
    .forEach((key) => sessionStorage.removeItem(key));

  await msalInstance.loginRedirect(microsoftLoginRequest);
};

export const handleMicrosoftCallback =
  async (): Promise<MicrosoftCallbackResult | null> => {
    const msalInstance = await getMsalInstance();

    const msalResponse = await msalInstance.handleRedirectPromise({
      navigateToLoginRequestUrl: false,
    });

    if (!msalResponse?.idToken) {
      return null;
    }

    const exchange = await ssoExchange(msalResponse.idToken);

    return {
      exchange,
      idToken: msalResponse.idToken,
      accessToken: msalResponse.accessToken,
      idTokenClaims: (msalResponse.idTokenClaims as Record<string, unknown>) || undefined,
    };
  };

export async function loginRequest(email: string, password: string) {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}

export interface PermissionBootstrapResponse {
  success: boolean;
  data: {
    role: string;
    pages: PagePermission[];
  };
}

export const getMyPagePermissions = async () => {
  const response = await api.get("/auth/me/permissions");
  return response.data as PermissionBootstrapResponse;
};

export const getUserSession = async () => {
  const token = localStorage.getItem("token");
  const sessionToken = localStorage.getItem("session_token");

  if (!token || !sessionToken) throw new Error("Missing token");

  const res = await axios.post(
    "/user/get_session",
    { data: sessionToken },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

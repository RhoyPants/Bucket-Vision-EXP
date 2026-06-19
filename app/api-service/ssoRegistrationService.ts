import axiosApi from "@/app/lib/axios";

export interface SsoRegistrationApprovalPayload {
  roleId?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  businessUnitId?: string;
  position?: string;
  remarks?: string;
}

export interface SsoRegistrationRejectionPayload {
  reason: string;
}

export async function getSsoRegistrationRequests(status?: string) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") {
    params.append("status", status);
  }

  const query = params.toString();
  const res = await axiosApi.get(
    query
      ? `/auth/sso/microsoft/registrations?${query}`
      : "/auth/sso/microsoft/registrations"
  );

  const payload = res.data?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;

  return [];
}

export async function getSsoRegistrationAudits(params?: {
  registrationId?: string;
  email?: string;
}) {
  const query = new URLSearchParams();
  if (params?.registrationId) query.append("registrationId", params.registrationId);
  if (params?.email) query.append("email", params.email);

  const res = await axiosApi.get(
    query.toString()
      ? `/auth/sso/microsoft/registrations/audits?${query.toString()}`
      : "/auth/sso/microsoft/registrations/audits"
  );

  const payload = res.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

export async function approveSsoRegistrationRequest(
  id: string,
  data: SsoRegistrationApprovalPayload
) {
  const res = await axiosApi.patch(
    `/auth/sso/microsoft/registrations/${id}/approve`,
    data
  );
  return res.data;
}

export async function rejectSsoRegistrationRequest(
  id: string,
  data: SsoRegistrationRejectionPayload
) {
  const res = await axiosApi.patch(
    `/auth/sso/microsoft/registrations/${id}/reject`,
    data
  );
  return res.data;
}

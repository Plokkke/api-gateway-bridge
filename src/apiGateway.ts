import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { z } from 'zod';

import { ccfTokenConfigSchema, tokenInjector } from './openid';

export const apiKeySchema = z.object({
  field: z.string(),
  key: z.string(),
});
export type ApiKey = z.infer<typeof apiKeySchema>;

export const apiGatewayAuthSchema = z.union([apiKeySchema, ccfTokenConfigSchema]);
export type ApiGatewayAuth = z.infer<typeof apiGatewayAuthSchema>;

export const apiGatewayConfigSchema = z
  .object({
    host: z.string().url(),
    endpoint: z.string().optional(),
    authentication: apiGatewayAuthSchema.optional(),
    authentications: z.array(apiGatewayAuthSchema).optional().default([]),
  })
  .transform((data) => {
    if (data.authentication) {
      data.authentications.push(data.authentication);
    }
    return {
      host: data.host,
      endpoint: data.endpoint,
      authentications: data.authentications,
    };
  })
  .refine((data) => data.authentications.length > 0, {
    message: 'At least one authentication must be provided',
    path: ['authentications'],
  });
export type ApiGatewayConfig = z.infer<typeof apiGatewayConfigSchema>;

function applyAuthentication(instance: AxiosInstance, auth: ApiGatewayAuth) {
  if ('key' in auth) {
    instance.defaults.headers.common[auth.field] = auth.key;
  }
  if ('issuer' in auth) {
    instance.interceptors.request.use(tokenInjector(auth));
  }
}

export function configureApiGateway(config: ApiGatewayConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: `${config.host}${config.endpoint ?? ''}`,
    allowAbsoluteUrls: false,
  } as AxiosRequestConfig);

  for (const auth of config.authentications) {
    applyAuthentication(instance, auth);
  }

  return instance;
}

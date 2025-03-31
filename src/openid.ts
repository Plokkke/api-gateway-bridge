import { InternalAxiosRequestConfig } from 'axios';
import { Issuer, TokenSet } from 'openid-client';
import { z } from 'zod';

export const ccfTokenConfigSchema = z.object({
  issuer: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  scopes: z.array(z.string()),
});

export type CCFTokenConfig = z.infer<typeof ccfTokenConfigSchema>;

export function tokenInjector(
  config: CCFTokenConfig,
): (req: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig> {
  let tokenSet: TokenSet;

  const clientPromise: Promise<Issuer> = Issuer.discover(config.issuer);

  async function getToken(): Promise<void> {
    const { Client } = await clientPromise;
    const client = new Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });
    tokenSet = await client.grant({
      grant_type: 'client_credentials',
      scope: config.scopes.join(' '),
    });
  }

  return async (req: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (!tokenSet || tokenSet.expired()) {
      await getToken();
    }
    req.headers['Authorization'] = `${tokenSet.token_type} ${tokenSet.access_token}`;
    return req;
  };
}

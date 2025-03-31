import { InternalAxiosRequestConfig } from 'axios';
import { Issuer, TokenSet } from 'openid-client';

import { tokenInjector, ccfTokenConfigSchema } from '@/openid';

jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
  TokenSet: jest.fn(),
}));

describe('OpenID Token Injector', () => {
  const mockConfig = {
    issuer: 'https://test-issuer.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    scopes: ['scope1', 'scope2'],
  };

  let mockTokenSet: TokenSet;
  let mockGrant: jest.Mock;

  beforeEach(() => {
    mockTokenSet = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expiresAt: Date.now() + 3600 * 1000,
      expired: () => false,
    } as unknown as TokenSet;
    mockGrant = jest.fn().mockResolvedValue(mockTokenSet);
    (Issuer.discover as jest.Mock).mockResolvedValue({
      Client: jest.fn().mockImplementation(() => ({
        grant: mockGrant,
      })),
    });
    (TokenSet as jest.Mock).mockImplementation((data) => ({
      ...data,
      expired: () => false,
    }));
  });

  describe('Configuration Schema', () => {
    it('should validate correct configuration', () => {
      expect(() => ccfTokenConfigSchema.parse(mockConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        issuer: 'https://test-issuer.com',
        clientId: 'test-client-id',
        // Missing clientSecret
        scopes: ['scope1'],
      };
      expect(() => ccfTokenConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('Token Injector', () => {
    it('should inject token into request headers', async () => {
      const injector = tokenInjector(mockConfig);
      const mockRequest: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const result = await injector(mockRequest);

      expect(result.headers['Authorization']).toBe('Bearer test-access-token');
      expect(mockGrant).toHaveBeenCalledTimes(1);
      expect(mockGrant).toHaveBeenCalledWith({
        grant_type: 'client_credentials',
        scope: 'scope1 scope2',
      });
    });

    it('should not call getToken if token is set and not expired', async () => {
      const injector = tokenInjector(mockConfig);
      const mockRequest: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      await injector(mockRequest);
      expect(mockGrant).toHaveBeenCalledTimes(1);

      await injector(mockRequest);
      expect(mockGrant).toHaveBeenCalledTimes(1);
    });

    it('should call getToken if token is set but expired', async () => {
      const injector = tokenInjector(mockConfig);
      const mockRequest: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      await injector(mockRequest);
      expect(mockGrant).toHaveBeenCalledTimes(1);

      mockTokenSet.expired = () => true;

      await injector(mockRequest);
      expect(mockGrant).toHaveBeenCalledTimes(2);
    });

    it('should refresh token when expired', async () => {
      const expiredTokenSet = {
        ...mockTokenSet,
        expired: () => true,
      };
      mockGrant.mockResolvedValueOnce(expiredTokenSet).mockResolvedValueOnce(mockTokenSet);

      const injector = tokenInjector(mockConfig);
      const mockRequest: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      await injector(mockRequest);
      await injector(mockRequest);

      expect(mockGrant).toHaveBeenCalledTimes(2);
      expect(mockGrant).toHaveBeenNthCalledWith(1, {
        grant_type: 'client_credentials',
        scope: 'scope1 scope2',
      });
      expect(mockGrant).toHaveBeenNthCalledWith(2, {
        grant_type: 'client_credentials',
        scope: 'scope1 scope2',
      });
    });

    it('should handle discovery errors', async () => {
      const error = new Error('Discovery failed');
      (Issuer.discover as jest.Mock).mockRejectedValue(error);

      const injector = tokenInjector(mockConfig);
      const mockRequest: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      await expect(injector(mockRequest)).rejects.toThrow('Discovery failed');
    });

    it('should handle token grant errors', async () => {
      const error = new Error('Token grant failed');
      mockGrant.mockRejectedValue(error);

      const injector = tokenInjector(mockConfig);
      const mockRequest: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      await expect(injector(mockRequest)).rejects.toThrow('Token grant failed');
    });
  });
});

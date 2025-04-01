import axios from 'axios';

import { configureApiGateway, apiGatewayConfigSchema } from '@/apiGateway';
import { tokenInjector } from '@/openid';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the tokenInjector
jest.mock('../src/openid', () => ({
  ...jest.requireActual('../src/openid'),
  tokenInjector: jest.fn(),
}));

describe('API Gateway', () => {
  const mockBaseConfig = {
    host: 'https://api.example.com',
    endpoint: '/v1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: jest.fn(),
        },
      },
    } as any);
  });

  describe('Configuration Schema', () => {
    it('should validate correct configuration with single authentication', () => {
      const config = {
        ...mockBaseConfig,
        authentication: {
          field: 'X-API-Key',
          key: 'test-key',
        },
      };
      expect(() => apiGatewayConfigSchema.parse(config)).not.toThrow();
    });

    it('should validate correct configuration with multiple authentications', () => {
      const config = {
        ...mockBaseConfig,
        authentications: [
          {
            field: 'X-API-Key',
            key: 'test-key',
          },
          {
            issuer: 'https://test-issuer.com',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            scopes: ['scope1'],
          },
        ],
      };
      expect(() => apiGatewayConfigSchema.parse(config)).not.toThrow();
    });

    it('should reject configuration without authentication', () => {
      expect(() => apiGatewayConfigSchema.parse(mockBaseConfig)).toThrow(
        'At least one authentication must be provided',
      );
    });

    it('should transform single authentication into authentications array', () => {
      const config = {
        ...mockBaseConfig,
        authentication: {
          field: 'X-API-Key',
          key: 'test-key',
        },
      };
      const result = apiGatewayConfigSchema.parse(config);
      expect(result.authentications).toHaveLength(1);
      expect(result.authentications[0]).toEqual(config.authentication);
    });

    it('should validate configuration without endpoint', () => {
      const config = {
        host: 'https://api.example.com',
        authentication: {
          field: 'X-API-Key',
          key: 'test-key',
        },
      };
      expect(() => apiGatewayConfigSchema.parse(config)).not.toThrow();
    });

    it('should validate OpenID configuration without scopes', () => {
      const config = {
        ...mockBaseConfig,
        authentication: {
          issuer: 'https://test-issuer.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
      };
      expect(() => apiGatewayConfigSchema.parse(config)).not.toThrow();
    });

    it('should create axios instance with correct base URL when endpoint is not provided', () => {
      const config = apiGatewayConfigSchema.parse({
        host: 'https://api.example.com',
        authentication: {
          field: 'X-API-Key',
          key: 'test-key',
        },
      });
      configureApiGateway(config);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        allowAbsoluteUrls: false,
      });
    });
  });

  describe('API Gateway Instance', () => {
    it('should create axios instance with correct base URL', () => {
      const config = apiGatewayConfigSchema.parse({
        ...mockBaseConfig,
        authentication: {
          field: 'X-API-Key',
          key: 'test-key',
        },
      });
      configureApiGateway(config);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com/v1',
        allowAbsoluteUrls: false,
      });
    });

    it('should apply API key authentication', () => {
      const apiKeyAuth = {
        field: 'X-API-Key',
        key: 'test-key',
      };
      const config = apiGatewayConfigSchema.parse({
        ...mockBaseConfig,
        authentication: apiKeyAuth,
      });
      const instance = configureApiGateway(config);
      expect(instance.defaults.headers.common['X-API-Key']).toBe('test-key');
    });

    it('should apply OpenID authentication', () => {
      const openIdAuth = {
        issuer: 'https://test-issuer.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopes: ['scope1'],
      };
      const config = apiGatewayConfigSchema.parse({
        ...mockBaseConfig,
        authentication: openIdAuth,
      });
      const instance = configureApiGateway(config);
      expect(instance.interceptors.request.use).toHaveBeenCalledWith(tokenInjector(openIdAuth));
    });

    it('should apply multiple authentications', () => {
      const openIdAuth = {
        issuer: 'https://test-issuer.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopes: ['scope1'],
      };
      const config = apiGatewayConfigSchema.parse({
        ...mockBaseConfig,
        authentications: [
          {
            field: 'X-API-Key',
            key: 'test-key',
          },
          openIdAuth,
        ],
      });
      const instance = configureApiGateway(config);
      expect(instance.defaults.headers.common['X-API-Key']).toBe('test-key');
      expect(instance.interceptors.request.use).toHaveBeenCalledWith(tokenInjector(openIdAuth));
    });
  });
});

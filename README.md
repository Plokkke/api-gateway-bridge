# API Gateway Bridge

A TypeScript library to simplify interaction with API Gateways, offering flexible authentication management and OpenID Connect integration.

## Installation

```bash
npm install api-gateway-bridge
# or
yarn add api-gateway-bridge
```

## Features

- Flexible API Gateway configuration
- API Key authentication support
- OAuth2/OpenID Connect authentication support with client credentials
- Configuration validation with Zod
- Pre-configured Axios instance

## Usage

### Basic Configuration

```typescript
import { apiGatewayApi } from 'api-gateway-bridge';

const api = apiGatewayApi({
  host: 'https://api.example.com',
  endpoint: '/v1',
  authentication: {
    field: 'X-API-Key',
    key: 'your-api-key'
  }
});
```

### Using with OpenID Connect

```typescript
import { apiGatewayApi } from 'api-gateway-bridge';

const api = apiGatewayApi({
  host: 'https://api.example.com',
  endpoint: '/v1',
  authentication: {
    issuer: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    scopes: ['api:read', 'api:write']
  }
});
```

### Using Multiple Authentication Methods

```typescript
import { apiGatewayApi } from 'api-gateway-bridge';

const api = apiGatewayApi({
  host: 'https://api.example.com',
  endpoint: '/v1',
  authentications: [
    {
      field: 'X-API-Key',
      key: 'your-api-key'
    },
    {
      issuer: 'https://auth.example.com',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      scopes: ['api:read', 'api:write']
    }
  ]
});
```

### API Usage

The library provides a pre-configured Axios instance with all authentication methods applied. You can use it like any other Axios instance:

```typescript
// The api instance is ready to use with all authentication methods configured
const response = await api.get('/your-endpoint');
```

## Types

### ApiGatewayConfig

```typescript
type ApiGatewayConfig = {
  host: string;
  endpoint?: string;
  authentication?: ApiGatewayAuth;
  authentications?: ApiGatewayAuth[];
}
```

### ApiGatewayAuth

```typescript
type ApiGatewayAuth = {
  field: string;
  key: string;
} | {
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
}
```

## Security

- OAuth2 tokens are automatically renewed when they expire
- API keys are securely stored in headers
- Configurations are validated with Zod to ensure type safety

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## License

MIT 
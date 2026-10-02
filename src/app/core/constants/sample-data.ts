export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  data: any;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'user-profile',
    name: 'User Profile & Settings',
    description: 'User details, preferences, addresses, and order history',
    data: {
      "user": {
        "id": "usr_948201",
        "name": "John Doe",
        "username": "johndoe_dev",
        "email": "john.doe@example.com",
        "role": "Senior Engineer",
        "active": true,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        "profile": {
          "age": 32,
          "city": "Lahore",
          "country": "Pakistan",
          "coordinates": {
            "latitude": 31.5204,
            "longitude": 74.3587
          }
        },
        "skills": ["TypeScript", "Angular", "Node.js", "GraphQL", "Docker"],
        "preferences": {
          "theme": "dark",
          "notifications": {
            "email": true,
            "push": false,
            "sms": false
          },
          "language": "en-US"
        },
        "orders": [
          {
            "id": "ord_1001",
            "date": "2026-09-15T10:30:00Z",
            "total": 249.99,
            "currency": "USD",
            "status": "delivered",
            "items": [
              { "sku": "KB-900", "name": "Mechanical Keyboard", "qty": 1, "price": 149.99 },
              { "sku": "MS-300", "name": "Wireless Mouse", "qty": 1, "price": 100.00 }
            ]
          },
          {
            "id": "ord_1002",
            "date": "2026-09-28T14:15:00Z",
            "total": 450.00,
            "currency": "USD",
            "status": "processing",
            "items": [
              { "sku": "MN-270", "name": "4K Gaming Monitor", "qty": 1, "price": 450.00 }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'ecommerce-cart',
    name: 'E-Commerce Storefront',
    description: 'Products inventory, categories, pricing, and stock',
    data: {
      "store": "TechMarket Pro",
      "currency": "USD",
      "updatedAt": "2026-10-02T12:00:00Z",
      "categories": ["Electronics", "Computers", "Accessories"],
      "inventory": [
        {
          "id": "prod_01",
          "title": "Ultra-Wide Curved Monitor 34\"",
          "price": 799.99,
          "inStock": true,
          "quantity": 42,
          "rating": 4.8,
          "tags": ["display", "gaming", "hdr"],
          "specifications": {
            "resolution": "3440 x 1440",
            "refreshRate": "144Hz",
            "panel": "OLED",
            "hdr": true
          }
        },
        {
          "id": "prod_02",
          "title": "Noise-Canceling Wireless Headphones",
          "price": 299.50,
          "inStock": true,
          "quantity": 128,
          "rating": 4.6,
          "tags": ["audio", "bluetooth", "active-nc"],
          "specifications": {
            "batteryLife": "30 Hours",
            "bluetoothVersion": "5.3",
            "weightGrams": 250
          }
        }
      ]
    }
  },
  {
    id: 'api-response',
    name: 'REST API Response',
    description: 'Pagination metadata, status codes, and dataset payload',
    data: {
      "status": 200,
      "success": true,
      "message": "Data retrieved successfully",
      "meta": {
        "page": 1,
        "pageSize": 20,
        "totalPages": 5,
        "totalRecords": 98,
        "executionTimeMs": 14.2
      },
      "data": [
        { "id": 1, "name": "Alpha Service", "endpoint": "/v1/alpha", "health": "HEALTHY", "latencyMs": 12 },
        { "id": 2, "name": "Beta Pipeline", "endpoint": "/v1/beta", "health": "HEALTHY", "latencyMs": 28 },
        { "id": 3, "name": "Gamma Queue", "endpoint": "/v1/gamma", "health": "DEGRADED", "latencyMs": 240 }
      ],
      "warnings": null
    }
  }
];

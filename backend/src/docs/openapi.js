// Hand-built OpenAPI 3.0 specification describing the full CMMS REST API.
// Served as interactive Swagger UI at /api/docs and raw JSON at /api/docs.json
// so external systems can generate clients / integrate against this API.

const commonResponses = {
  400: { description: 'Validation error' },
  401: { description: 'Missing or invalid credentials' },
  403: { description: 'Insufficient permissions' },
  404: { description: 'Resource not found' },
};

function paginatedList(schemaRef, summary, tag, extraParams = []) {
  return {
    get: {
      tags: [tag],
      summary,
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 25 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        ...extraParams,
      ],
      responses: {
        200: {
          description: 'A page of results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'array', items: { $ref: `#/components/schemas/${schemaRef}` } },
                  meta: { $ref: '#/components/schemas/PageMeta' },
                },
              },
            },
          },
        },
        ...commonResponses,
      },
    },
  };
}

function crudItem(schemaRef, tag, { readOnly = false } = {}) {
  const paths = {
    get: {
      tags: [tag],
      summary: `Get a single ${schemaRef}`,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'OK' }, ...commonResponses },
    },
  };
  if (!readOnly) {
    paths.put = {
      tags: [tag],
      summary: `Update a ${schemaRef}`,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { 200: { description: 'Updated' }, ...commonResponses },
    };
    paths.delete = {
      tags: [tag],
      summary: `Delete a ${schemaRef}`,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Deleted' }, ...commonResponses },
    };
  }
  return paths;
}

function createOp(schemaRef, tag) {
  return {
    post: {
      tags: [tag],
      summary: `Create a ${schemaRef}`,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaRef}` } } },
      },
      responses: { 201: { description: 'Created' }, ...commonResponses },
    },
  };
}

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CMMS API',
    version: '1.0.0',
    description:
      'REST API for the Computerized Maintenance Management System (CMMS). '
      + 'Supports two authentication modes so both human users and external systems can integrate: '
      + 'a JWT bearer token (obtained via POST /api/auth/login) for logged-in users, and an X-API-Key header '
      + 'for machine-to-machine integrations (create keys under Settings > API Keys, or POST /api/api-keys). '
      + 'Outbound webhooks (see /api/webhooks) let this CMMS push real-time events '
      + '(work_order.created, work_order.completed, asset.status_changed, part.low_stock) to other systems.',
  },
  servers: [{ url: '/api', description: 'This server' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
    schemas: {
      PageMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' }, pageSize: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' },
        },
      },
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, assetTag: { type: 'string' },
          category: { type: 'string' }, manufacturer: { type: 'string' }, modelNumber: { type: 'string' },
          serialNumber: { type: 'string' }, status: { type: 'string', enum: ['operational', 'down', 'maintenance', 'retired'] },
          criticality: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          locationId: { type: 'string', format: 'uuid' }, parentId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      WorkOrder: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }, woNumber: { type: 'string' }, title: { type: 'string' },
          description: { type: 'string' }, type: { type: 'string', enum: ['corrective', 'preventive', 'inspection', 'emergency', 'project'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          status: { type: 'string', enum: ['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'] },
          assetId: { type: 'string', format: 'uuid' }, assignedToId: { type: 'string', format: 'uuid' },
          dueDate: { type: 'string', format: 'date-time' },
          tasks: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' } } } },
        },
      },
      Location: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, code: { type: 'string' }, parentId: { type: 'string', nullable: true } } },
      PreventiveMaintenance: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, assetId: { type: 'string' },
          frequencyType: { type: 'string', enum: ['days', 'weeks', 'months'] }, frequencyValue: { type: 'integer' },
          nextDueDate: { type: 'string', format: 'date-time' }, isActive: { type: 'boolean' },
        },
      },
      Part: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, partNumber: { type: 'string' },
          quantityOnHand: { type: 'number' }, reorderPoint: { type: 'number' }, unitCost: { type: 'number' },
        },
      },
      Vendor: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, category: { type: 'string' } } },
      PurchaseOrder: { type: 'object', properties: { id: { type: 'string' }, poNumber: { type: 'string' }, vendorId: { type: 'string' }, status: { type: 'string' } } },
      Meter: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, assetId: { type: 'string' }, unit: { type: 'string' }, currentReading: { type: 'number' } } },
      DowntimeLog: { type: 'object', properties: { id: { type: 'string' }, assetId: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' }, category: { type: 'string' } } },
      ApiKey: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } }, key: { type: 'string', description: 'Only present in the create response - shown once' } } },
      Webhook: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, url: { type: 'string' }, events: { type: 'array', items: { type: 'string' } } } },
    },
  },
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Log in with email + password, returns a JWT bearer token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } } },
        responses: { 200: { description: 'OK, returns { token, user }' }, 401: commonResponses[401] },
        security: [],
      },
    },
    '/auth/me': { get: { tags: ['Auth'], summary: 'Get the current authenticated user', responses: { 200: { description: 'OK' } } } },

    '/assets': { ...paginatedList('Asset', 'List assets', 'Assets', [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'locationId', in: 'query', schema: { type: 'string' } }]), ...createOp('Asset', 'Assets') },
    '/assets/{id}': crudItem('Asset', 'Assets'),

    '/work-orders': { ...paginatedList('WorkOrder', 'List work orders', 'Work Orders', [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'priority', in: 'query', schema: { type: 'string' } }, { name: 'assetId', in: 'query', schema: { type: 'string' } }, { name: 'overdue', in: 'query', schema: { type: 'boolean' } }]), ...createOp('WorkOrder', 'Work Orders') },
    '/work-orders/{id}': crudItem('WorkOrder', 'Work Orders'),
    '/work-orders/{id}/tasks': { post: { tags: ['Work Orders'], summary: 'Add a checklist task to a work order', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Created' } } } },
    '/work-orders/{id}/parts': { post: { tags: ['Work Orders'], summary: 'Issue a part against a work order (decrements stock)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { partId: { type: 'string' }, quantity: { type: 'number' } } } } } }, responses: { 201: { description: 'Created' } } } },

    '/locations': { ...paginatedList('Location', 'List locations', 'Locations'), ...createOp('Location', 'Locations') },
    '/locations/{id}': crudItem('Location', 'Locations'),

    '/preventive-maintenance': { get: { tags: ['Preventive Maintenance'], summary: 'List PM schedules', responses: { 200: { description: 'OK' } } }, ...createOp('PreventiveMaintenance', 'Preventive Maintenance') },
    '/preventive-maintenance/{id}': crudItem('PreventiveMaintenance', 'Preventive Maintenance'),
    '/preventive-maintenance/{id}/generate': { post: { tags: ['Preventive Maintenance'], summary: 'Force-generate the next work order from this PM schedule now', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Created' } } } },

    '/parts': { ...paginatedList('Part', 'List parts / inventory', 'Inventory', [{ name: 'lowStock', in: 'query', schema: { type: 'boolean' } }]), ...createOp('Part', 'Inventory') },
    '/parts/{id}': crudItem('Part', 'Inventory'),
    '/parts/{id}/transactions': {
      get: { tags: ['Inventory'], summary: 'List stock transactions for a part', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      post: { tags: ['Inventory'], summary: 'Record a receive / adjust / return stock transaction', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { type: { type: 'string', enum: ['receive', 'adjust', 'return'] }, quantity: { type: 'number' } } } } } }, responses: { 201: { description: 'Created' } } },
    },

    '/vendors': { ...paginatedList('Vendor', 'List vendors', 'Vendors'), ...createOp('Vendor', 'Vendors') },
    '/vendors/{id}': crudItem('Vendor', 'Vendors'),

    '/purchase-orders': { get: { tags: ['Purchase Orders'], summary: 'List purchase orders', responses: { 200: { description: 'OK' } } }, ...createOp('PurchaseOrder', 'Purchase Orders') },
    '/purchase-orders/{id}': crudItem('PurchaseOrder', 'Purchase Orders'),
    '/purchase-orders/{id}/receive': { post: { tags: ['Purchase Orders'], summary: 'Mark a purchase order received and increment part stock', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },

    '/meters': { get: { tags: ['Meters'], summary: 'List meters', responses: { 200: { description: 'OK' } } }, ...createOp('Meter', 'Meters') },
    '/meters/{id}': crudItem('Meter', 'Meters'),
    '/meters/{id}/readings': { post: { tags: ['Meters'], summary: 'Record a meter reading', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Created' } } } },

    '/downtime-logs': { ...paginatedList('DowntimeLog', 'List downtime logs', 'Downtime'), ...createOp('DowntimeLog', 'Downtime') },
    '/downtime-logs/{id}': crudItem('DowntimeLog', 'Downtime'),

    '/api-keys': { get: { tags: ['API Keys'], summary: 'List API keys (secrets not included)', responses: { 200: { description: 'OK' } } }, ...createOp('ApiKey', 'API Keys') },
    '/api-keys/{id}': crudItem('ApiKey', 'API Keys', { readOnly: false }),

    '/webhooks': { get: { tags: ['Webhooks'], summary: 'List webhook subscriptions', responses: { 200: { description: 'OK' } } }, ...createOp('Webhook', 'Webhooks') },
    '/webhooks/{id}': crudItem('Webhook', 'Webhooks'),
    '/webhooks/{id}/test': { post: { tags: ['Webhooks'], summary: 'Send a test event to this webhook', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/webhooks/events': { get: { tags: ['Webhooks'], summary: 'List available webhook event types', responses: { 200: { description: 'OK' } } } },

    '/audit-logs': { get: { tags: ['Audit'], summary: 'List audit log entries', responses: { 200: { description: 'OK' } } } },

    '/reports/dashboard': { get: { tags: ['Reports'], summary: 'Get dashboard KPIs', responses: { 200: { description: 'OK' } } } },
    '/reports/assets/{assetId}/reliability': { get: { tags: ['Reports'], summary: 'Get MTTR / MTBF reliability stats for an asset', parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },

    '/users': { get: { tags: ['Users'], summary: 'List users', responses: { 200: { description: 'OK' } } } },
    '/users/roles': { get: { tags: ['Users'], summary: 'List roles', responses: { 200: { description: 'OK' } } } },
  },
};

module.exports = openApiSpec;

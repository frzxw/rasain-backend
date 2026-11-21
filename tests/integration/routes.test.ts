import userRoutes from '../../src/routes/users';
import notificationRoutes from '../../src/routes/notifications';
import request from 'supertest';
import app from '../../src/server';

type Layer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
};

function routeOrder(router: { stack: Layer[] }): string[] {
  return router.stack
    .filter((layer) => layer.route)
    .map((layer) => {
      const method = Object.keys(layer.route!.methods)[0]?.toUpperCase();
      return `${method} ${layer.route!.path}`;
    });
}

describe('Route registration order', () => {
  test('user dashboard is registered before /:id', () => {
    const paths = routeOrder(userRoutes as unknown as { stack: Layer[] });
    expect(paths.indexOf('GET /dashboard')).toBeGreaterThanOrEqual(0);
    expect(paths.indexOf('GET /dashboard')).toBeLessThan(paths.indexOf('GET /:id'));
  });

  test('notification bulk routes are registered before /:id', () => {
    const paths = routeOrder(notificationRoutes as unknown as { stack: Layer[] });
    expect(paths.indexOf('PATCH /mark-all-read')).toBeLessThan(paths.indexOf('PATCH /:id'));
    expect(paths.indexOf('PATCH /bulk-archive')).toBeLessThan(paths.indexOf('PATCH /:id'));
  });

  test('GET /api/v1/users/dashboard without a token is unauthorized', async () => {
    const response = await request(app)
      .get('/api/v1/users/dashboard')
      .expect(401);

    expect(response.body.message).toContain('Not authorized');
  });
});

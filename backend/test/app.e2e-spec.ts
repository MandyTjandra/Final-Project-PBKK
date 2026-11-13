import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { BrewMethod, Difficulty, ProcessMethod, RoastLevel } from '../src/common/enums/coffee.enum.js';

describe('BrewLab Full E2E Integration Suite', () => {
  let app: INestApplication;

  let roasterToken: string;
  let roasterRefreshToken: string;
  let roasterId: string;

  let brewerToken: string;

  let createdBeanId: string;
  let createdRecipeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication & Authorization Flow', () => {
    const roasterEmail = `e2e.roaster.${Date.now()}@coffee.test`;
    const brewerEmail = `e2e.brewer.${Date.now()}@coffee.test`;

    it('POST /api/auth/register - Register Roaster -> success (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: roasterEmail,
          password: 'password123',
          name: 'E2E Roaster Shop',
          role: Role.ROASTER,
        })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(roasterEmail);
      expect(res.body.user.role).toBe(Role.ROASTER);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      roasterToken = res.body.accessToken;
      roasterRefreshToken = res.body.refreshToken;
      roasterId = res.body.user.id;
    });

    it('POST /api/auth/register - Register Brewer -> success (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: brewerEmail,
          password: 'password123',
          name: 'E2E Home Brewer',
          role: Role.BREWER,
        })
        .expect(201);

      brewerToken = res.body.accessToken;
    });

    it('POST /api/auth/register - Duplicate email -> fail (409)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: roasterEmail,
          password: 'password123',
          name: 'Duplicate',
        })
        .expect(409);
    });

    it('POST /api/auth/register - Invalid DTO (short password) -> fail (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid@coffee.test',
          password: '123',
          name: 'Short',
        })
        .expect(400);
    });

    it('POST /api/auth/login - Valid credentials -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: roasterEmail,
          password: 'password123',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(roasterEmail);
    });

    it('POST /api/auth/login - Invalid password -> fail (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: roasterEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('POST /api/auth/refresh - Valid refresh token -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: roasterRefreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      // Update with rotated tokens
      roasterToken = res.body.accessToken;
      roasterRefreshToken = res.body.refreshToken;
    });

    it('GET /api/auth/me - Without auth token -> fail (401)', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('GET /api/auth/me - With valid token -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${roasterToken}`)
        .expect(200);

      expect(res.body.id).toBe(roasterId);
      expect(res.body.email).toBe(roasterEmail);
    });
  });

  describe('2. File Upload Module', () => {
    it('POST /api/uploads/image - Without token -> fail (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/uploads/image')
        .attach('file', Buffer.from('fake image content'), 'test.png')
        .expect(401);
    });

    it('POST /api/uploads/image - Non-image file (.txt) -> fail (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${roasterToken}`)
        .attach('file', Buffer.from('just a text file'), 'test.txt')
        .expect(400);
    });

    it('POST /api/uploads/image - Valid image file -> success (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${roasterToken}`)
        .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
          filename: 'beans.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(res.body.url).toContain('/uploads/');
      expect(res.body.mimeType).toBe('image/png');
    });
  });

  describe('3. Coffee Beans Catalog & Inventory Flow', () => {
    it('POST /api/beans - Create bean as Brewer (non-roaster) -> fail (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/beans')
        .set('Authorization', `Bearer ${brewerToken}`)
        .send({
          name: 'Forbidden Bean',
          origin: 'Aceh',
          varietal: 'Typica',
          process: ProcessMethod.WASHED,
          roastLevel: RoastLevel.LIGHT,
          stockGrams: 1000,
          price: 150000,
          tastingNotes: 'Citrus',
        })
        .expect(403);
    });

    it('POST /api/beans - Create bean with missing required fields -> fail (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/beans')
        .set('Authorization', `Bearer ${roasterToken}`)
        .send({
          origin: 'Aceh',
        })
        .expect(400);
    });

    it('POST /api/beans - Create bean as Roaster -> success (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/beans')
        .set('Authorization', `Bearer ${roasterToken}`)
        .send({
          name: 'E2E Mount Kerinci Natural',
          origin: 'Kerinci, Jambi, Indonesia',
          varietal: 'Andung Sari',
          process: ProcessMethod.NATURAL,
          roastLevel: RoastLevel.LIGHT_MEDIUM,
          altitudeMasl: 1600,
          stockGrams: 2000,
          minStockThreshold: 500,
          price: 135000,
          tastingNotes: 'Blackberry, Cinnamon, Dark Cherry',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('E2E Mount Kerinci Natural');
      createdBeanId = res.body.id;
    });

    it('GET /api/beans - List beans with search & filter -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/beans?search=Kerinci&process=NATURAL&page=1&limit=5')
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/beans/:id - Existing ID -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/beans/${createdBeanId}`)
        .expect(200);

      expect(res.body.id).toBe(createdBeanId);
      expect(res.body.name).toBe('E2E Mount Kerinci Natural');
    });

    it('GET /api/beans/:id - Non-existent ID -> fail (404)', async () => {
      await request(app.getHttpServer())
        .get('/api/beans/non-existent-uuid-9999')
        .expect(404);
    });

    it('PATCH /api/beans/:id - Update as non-owner Brewer -> fail (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/beans/${createdBeanId}`)
        .set('Authorization', `Bearer ${brewerToken}`)
        .send({ name: 'Hacked Bean' })
        .expect(403);
    });

    it('PATCH /api/beans/:id/stock - Update stock as owner Roaster -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/beans/${createdBeanId}/stock`)
        .set('Authorization', `Bearer ${roasterToken}`)
        .send({ stockGrams: 300 }) // Below threshold 500
        .expect(200);

      expect(res.body.stockGrams).toBe(300);
    });
  });

  describe('4. Brew Recipes, Ratio Calculator & Nested Steps Flow', () => {
    it('POST /api/recipes/calculate-ratio - Public ratio calculator -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/recipes/calculate-ratio')
        .send({
          coffeeDoseGrams: 15,
          targetRatio: 15,
          method: BrewMethod.V60,
        })
        .expect(200);

      expect(res.body.totalWaterMl).toBe(225);
      expect(res.body.recommendedWaterTemp).toBe(92);
      expect(res.body.generatedPourSteps.length).toBeGreaterThan(0);
    });

    it('POST /api/recipes - Create recipe with nested pour steps -> success (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${brewerToken}`)
        .send({
          coffeeBeanId: createdBeanId,
          title: 'E2E Sweet & Juicy V60 Recipe',
          method: BrewMethod.V60,
          grindSize: 'Medium-Fine',
          coffeeDoseGrams: 15,
          targetRatio: 15,
          totalWaterMl: 225,
          waterTempCelsius: 92,
          totalBrewTimeSeconds: 180,
          difficulty: Difficulty.BEGINNER,
          pourSteps: [
            { stepOrder: 1, startTimeSeconds: 0, waterAmountMl: 45, instruction: 'Bloom' },
            { stepOrder: 2, startTimeSeconds: 45, waterAmountMl: 90, instruction: 'Main Pour' },
            { stepOrder: 3, startTimeSeconds: 90, waterAmountMl: 90, instruction: 'Finishing Pour' },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.pourSteps.length).toBe(3);
      createdRecipeId = res.body.id;
    });

    it('GET /api/recipes/:id - Get recipe details with pour steps -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/recipes/${createdRecipeId}`)
        .expect(200);

      expect(res.body.title).toBe('E2E Sweet & Juicy V60 Recipe');
      expect(res.body.pourSteps.length).toBe(3);
      expect(res.body.pourSteps[0].instruction).toBe('Bloom');
    });

    it('POST /api/recipes/:id/reviews - Add review to recipe -> success (201)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/recipes/${createdRecipeId}/reviews`)
        .set('Authorization', `Bearer ${roasterToken}`)
        .send({
          rating: 5,
          comment: 'Fantastic sweetness extraction!',
        })
        .expect(201);

      expect(res.body.rating).toBe(5);
      expect(res.body.comment).toBe('Fantastic sweetness extraction!');
    });

    it('GET /api/recipes/:id/reviews - List recipe reviews -> success (200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/recipes/${createdRecipeId}/reviews`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('DELETE /api/recipes/:id - Delete recipe as non-owner Roaster -> fail (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/recipes/${createdRecipeId}`)
        .set('Authorization', `Bearer ${roasterToken}`)
        .expect(403);
    });

    it('DELETE /api/recipes/:id - Delete recipe as owner Brewer -> success (200)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/recipes/${createdRecipeId}`)
        .set('Authorization', `Bearer ${brewerToken}`)
        .expect(200);

      // Verify cascade delete
      await request(app.getHttpServer())
        .get(`/api/recipes/${createdRecipeId}`)
        .expect(404);
    });

    it('DELETE /api/beans/:id - Delete bean as owner Roaster -> success (200)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/beans/${createdBeanId}`)
        .set('Authorization', `Bearer ${roasterToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/beans/${createdBeanId}`)
        .expect(404);
    });
  });
});

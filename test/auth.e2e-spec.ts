import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { User } from '../src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

const testUser = {
  id: 10001,
  email: 'auth-e2e-test@user.com',
  password: 'e2e-test',
  firstname: 'FirstName',
  lastname: 'LastName',
  birthday: new Date().toISOString(),
};

describe('Auth', () => {
  let userRepository: Repository<User>;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.TYPEORM_HOST,
          port: Number(process.env.TYPEORM_PORT),
          username: process.env.TYPEORM_USERNAME,
          password: process.env.TYPEORM_PASSWORD,
          database: process.env.TYPEORM_DATABASE,
          entities: [User],
          synchronize: false,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    userRepository = moduleRef.get('UserRepository');
    const user = new User();
    user.id = testUser.id;
    user.email = testUser.email;
    user.password = await bcrypt.hash(testUser.password, 10);
    user.firstName = testUser.firstname;
    user.lastName = testUser.lastname;
    user.birthday = testUser.birthday;
    await userRepository.save(user);
  });

  describe('/POST /auth/login', () => {
    it(`should success login user`, async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: testUser.email,
          password: testUser.password,
        })
        .set('Accept', 'application/json')
        .expect(201);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('token');
    });

    it(`should not success login user with wrong email`, async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: 'wrong@email.com',
          password: testUser.password,
        })
        .set('Accept', 'application/json')
        .expect(401);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('message');
    });

    it(`should not success login user with wrong password`, async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .post('/auth/login')
        .send({
          login: testUser.email,
          password: 'wrong password',
        })
        .set('Accept', 'application/json')
        .expect(401);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('message');
    });

    it(`should not success login user with empty data`, async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .post('/auth/login')
        .set('Accept', 'application/json')
        .expect(401);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('message');
    });
  });

  describe('/POST /auth/register', () => {
    it('should success register user', () => {
      return request
        .agent(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          firstname: testUser.firstname,
          lastname: testUser.lastname,
          birthday: testUser.birthday,
        })
        .set('Accept', 'application/json')
        .expect(204);
    });

    it('should not success register with empty password field', async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          firstname: testUser.firstname,
          lastname: testUser.lastname,
          birthday: testUser.birthday,
        })
        .set('Accept', 'application/json')
        .expect(400);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('message');
    });

    it('should not success register with empty fields', async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .post('/auth/register')
        .set('Accept', 'application/json')
        .expect(400);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('message');
    });
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });
});

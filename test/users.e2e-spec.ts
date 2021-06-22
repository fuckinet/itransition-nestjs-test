import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { User, UserRole } from '../src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

const testUser = {
  id: 10002,
  email: 'users-e2e-test@user.com',
  password: 'e2e-test',
  firstname: 'FirstName',
  lastname: 'LastName',
  birthday: new Date().toISOString(),
  role: UserRole.ADMIN,
  token: null,
};

describe('Auth', () => {
  let userRepository: Repository<User>;
  let jwtService: JwtService;
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
    jwtService = moduleRef.get('JwtService');
    const user = new User();
    user.id = testUser.id;
    user.email = testUser.email;
    user.password = await bcrypt.hash(testUser.password, 10);
    user.firstName = testUser.firstname;
    user.lastName = testUser.lastname;
    user.birthday = testUser.birthday;
    user.role = [testUser.role];
    testUser.token = jwtService.sign({
      userId: user.id,
      roles: user.role,
    });
    await userRepository.save(user);
  });

  describe('/PATCH /users', () => {
    it(`should success edit user`, async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send({
          firstname: 'newName',
        })
        .set('Authorization', `Bearer ${testUser.token}`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('firstname');
      expect(body).not.toHaveProperty('lastname');
      expect(body).not.toHaveProperty('birthday');
    });

    it(`should error edit user without bearer token`, () => {
      return request
        .agent(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send({
          firstname: 'newName',
        })
        .set('Accept', 'application/json')
        .expect(401);
    });

    it(`should error edit user with wrong id`, async () => {
      const { body } = await request
        .agent(app.getHttpServer())
        .patch(`/users/${testUser.id + 1}`)
        .send({
          firstname: 'newName',
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(400);
      expect(body).not.toBeUndefined();
      expect(body).toHaveProperty('error');
    });
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });
});

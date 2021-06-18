import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { plainToClass } from 'class-transformer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';

const userTest: User = plainToClass(User, {
  id: 1,
  email: 'test@user.com',
  password: 'create in `beforeAll` block',
});

const findOneMock = jest.fn(({ where: { email } }) => {
  if (userTest.email === email) {
    return Promise.resolve(userTest);
  }
  return undefined;
});

const createMock = jest.fn((dto: any) => {
  return dto;
});

const saveMock = jest.fn((dto: any) => {
  return dto;
});

const MockRepository = jest.fn().mockImplementation(() => {
  return {
    findOne: findOneMock,
    create: createMock,
    save: saveMock,
  };
});
const mockRepository = new MockRepository();

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  beforeAll(async () => {
    userTest.password = await bcrypt.hash('test', 10);
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'jwt_token'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get<UsersService>(UsersService);
    authController = moduleRef.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerUser', () => {
    it('should create a new user', async () => {
      const saveSpy = jest.spyOn(mockRepository, 'save');

      const dto = {
        email: 'test@newuser.com',
        password: 'test',
        firstname: 'Firstname',
        lastname: 'Lastname',
        birthday: new Date().toISOString(),
      };
      await authController.registerUser(dto);

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('loginUser', () => {
    it('should return jwt token by login and password', async () => {
      const findOneSpy = jest.spyOn(mockRepository, 'findOne');

      const dto = {
        login: 'test@user.com',
        password: 'test',
      };
      const result = await authController.loginUser(dto);
      expect(result.token).toEqual('jwt_token');

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: dto.login },
      });
    });

    it('should return jwt token by wrong login and password', async () => {
      const findOneSpy = jest.spyOn(mockRepository, 'findOne');

      const dto = {
        login: 'test@wronguser.com',
        password: 'test',
      };

      await expect(authController.loginUser(dto)).rejects.toThrowError(
        HttpException,
      );

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: dto.login },
      });
    });
  });
});

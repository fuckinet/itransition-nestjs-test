import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

const userTest: User = plainToClass(User, {
  id: 1,
  email: 'test@user.com',
  password: 'create in `beforeAll` block',
});

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  const mockedRepo = {
    findOne: jest.fn(({ where: { email } }) => {
      if (userTest.email === email) {
        return Promise.resolve(userTest);
      }
      return undefined;
    }),
    save: jest.fn((user) => Promise.resolve(user)),
  };

  beforeAll(async () => {
    userTest.password = await bcrypt.hash('test', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
          useValue: mockedRepo,
        },
      ],
    }).compile();
    authService = await module.get(AuthService);
    jwtService = await module.get(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  afterEach(() => jest.clearAllMocks());

  describe('createUser', () => {
    it('should create an user', async () => {
      const saveSpy = jest.spyOn(mockedRepo, 'save');

      const dto = {
        email: 'test@newuser.com',
        password: 'test',
        firstname: 'Firstname',
        lastname: 'Lastname',
        birthday: new Date().toISOString(),
      };
      const result = await authService.createUser(dto);
      expect(result.birthday).toEqual(dto.birthday);
      expect(result.email).toEqual(dto.email);
      expect(result.firstName).toEqual(dto.firstname);
      expect(result.lastName).toEqual(dto.lastname);
      const isValidPassword = await bcrypt.compare(
        dto.password,
        result.password,
      );
      expect(isValidPassword).toEqual(true);

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(result);
    });
  });

  describe('loginUser', () => {
    it('should return jwt token by email and password', async () => {
      const findOneSpy = jest.spyOn(mockedRepo, 'findOne');

      const dto = {
        login: 'test@user.com',
        password: 'test',
      };
      const result = await authService.loginUser(dto);
      expect(result).toEqual('jwt_token');

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: dto.login },
      });
    });

    it('should return false by wrong email and password', async () => {
      const findOneSpy = jest.spyOn(mockedRepo, 'findOne');

      const dto = {
        login: 'unexisted@user.com',
        password: 'test',
      };
      const result = await authService.loginUser(dto);
      expect(result).toEqual(false);

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: dto.login },
      });
    });

    it('should return false by email and wrong password', async () => {
      const findOneSpy = jest.spyOn(mockedRepo, 'findOne');

      const dto = {
        login: 'test@user.com',
        password: 'wrong',
      };
      const result = await authService.loginUser(dto);
      expect(result).toEqual(false);

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: dto.login },
      });
    });
  });
});

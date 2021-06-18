import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Test } from '@nestjs/testing';
import { User } from '../entities/user.entity';
import { plainToClass } from 'class-transformer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException } from '@nestjs/common';

const createMock = jest.fn((dto: any) => {
  return dto;
});

const saveMock = jest.fn((dto: any) => {
  return dto;
});

const MockRepository = jest.fn().mockImplementation(() => {
  return {
    create: createMock,
    save: saveMock,
  };
});
const mockRepository = new MockRepository();

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    usersController = moduleRef.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
    expect(usersService).toBeDefined();
  });

  afterEach(() => jest.clearAllMocks());

  describe('editUser', () => {
    it('should edit an existing user', async () => {
      const userTest: User = plainToClass(User, {
        id: 1,
        email: 'test@user.com',
        firstname: 'Test',
        lastname: 'User',
        birthday: new Date().toISOString(),
      });
      jest
        .spyOn(usersService, 'findOneById')
        .mockImplementation(() => Promise.resolve(userTest));
      const params = {
        id: 1,
      };
      const dto = {
        firstname: 'test',
        lastname: 'test',
        birthday: new Date().toISOString(),
      };
      const result = await usersController.editUser(params, dto);
      expect(result.id).toBe(params.id);
      expect(result.firstname).toBe(dto.firstname);
      expect(result.lastname).toBe(dto.lastname);
      expect(result.birthday).toBe(dto.birthday);
    });

    it('should throw an error while edit an unexists user', async () => {
      jest
        .spyOn(usersService, 'findOneById')
        .mockImplementation(() => Promise.resolve(undefined));
      const params = {
        id: 2,
      };
      const dto = {
        firstname: 'firstname',
        lastname: 'lastname',
        birthday: new Date().toISOString(),
      };
      await expect(usersController.editUser(params, dto)).rejects.toThrowError(
        HttpException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

const userTest: User = plainToClass(User, { id: 1, email: 'test@user.com' });

describe('UsersService', () => {
  let service: UsersService;

  const mockedRepo = {
    findOne: jest.fn(() => Promise.resolve(userTest)),
    save: jest.fn((user) => Promise.resolve(user)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockedRepo,
        },
      ],
    }).compile();
    service = await module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOneById', () => {
    it('should return a User by id', async () => {
      const findOneSpy = jest.spyOn(mockedRepo, 'findOne');

      const user = await service.findOneById(userTest.id);
      expect(user).toEqual(userTest);

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith(user.id);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a User by email', async () => {
      const findOneSpy = jest.spyOn(mockedRepo, 'findOne');

      const user = await service.findOneByEmail(userTest.email);
      expect(user).toEqual(userTest);

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: userTest.email },
      });
    });
  });

  describe('saveUser', () => {
    it('should save a User', async () => {
      const saveSpy = jest.spyOn(mockedRepo, 'save');

      expect(userTest.id).toEqual(1);
      userTest.id = 2;
      const user = await service.saveUser(userTest);
      expect(user).toEqual(userTest);
      expect(userTest.id).toEqual(2);

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(userTest);
    });
  });
});

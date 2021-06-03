import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 32,
    nullable: false,
  })
  email: string;

  @Column('char', {
    length: 64,
    nullable: false,
  })
  password: string;

  @Column({
    length: 32,
    nullable: false,
  })
  firstName: string;

  @Column({
    length: 32,
    nullable: false,
  })
  lastName: string;

  @Column({
    type: 'set',
    enum: UserRole,
    default: [UserRole.MEMBER],
  })
  role: UserRole[];

  @Column('timestamp')
  birthday: string;
}

import {MigrationInterface, QueryRunner} from "typeorm";
import * as bcrypt from 'bcrypt';

export class AdminCreate1622727596999 implements MigrationInterface {
    name = 'AdminCreate1622727596999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const password = await bcrypt.hash('admin', 10);
        await queryRunner.query("INSERT INTO `user` (id, email, password, firstName, lastName, role, birthday) VALUES (1, 'admin@test.ru', '" + password + "', 'Admin', 'User', 'admin', '2021-06-03 16:05:01');");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DELETE FROM `user` WHERE `email` = 'admin@test.ru'");
    }

}

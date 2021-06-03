import {MigrationInterface, QueryRunner} from "typeorm";

export class UserAdd1622724337865 implements MigrationInterface {
    name = 'UserAdd1622724337865'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `user` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(32) NOT NULL, `password` char(64) NOT NULL, `firstName` varchar(32) NOT NULL, `lastName` varchar(32) NOT NULL, `role` set ('admin', 'member') NOT NULL DEFAULT 'member', `birthday` timestamp NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE `user`");
    }

}

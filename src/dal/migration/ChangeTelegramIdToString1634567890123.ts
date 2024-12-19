
import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTelegramIdToString1634567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telegram_user" ALTER COLUMN "telegramId" TYPE varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telegram_user" ALTER COLUMN "telegramId" TYPE bigint`);
    }
}
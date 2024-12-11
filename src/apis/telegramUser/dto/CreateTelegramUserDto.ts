import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class CreateTelegramUserDto {
    @Required()
    telegramId!: number;
    @Required()
    gender!: string;
    @Required()
    username!: string;
    @Required()
    age!: number;
}

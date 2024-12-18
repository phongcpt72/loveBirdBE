import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class CreateTelegramUserDto {
    @Required()
    telegramId!: string;
    @Required()
    gender!: string;
    @Required()
    username!: string;
    @Required()
    age!: number;
    @Required()
    avatarPublicId!: string;    
    @Required()
    avatar!: string;
}

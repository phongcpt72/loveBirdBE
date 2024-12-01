import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class CreateTelegramUserDto {

    @Property()
    @Required()
    telegramId: number;

    @Property()
    @Required()
    // @MinLength(3)
    // @MaxLength(20)
    username: string;

    @Property()
    @Required()
    gender: string;

    @Property()
    @Required()
    // @MinLength(3)
    // @MaxLength(20)
    address: string;
}

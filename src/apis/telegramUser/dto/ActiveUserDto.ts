import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class ActiveUserDto {
    @Required()
    telegramId!: string;
    @Required()
    followers!: number;
    @Required()
    holders!: number;
    @Required()
    activeTime!: string;
}

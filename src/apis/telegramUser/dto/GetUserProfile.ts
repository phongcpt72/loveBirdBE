import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetUserProfile {
    @Property()
    telegramId!: number;
    @Property()
    username!: string;
    @Property()
    age!: number;
    @Property()
    avatar!: string;
    @Property()
    publicKey!: string;
}

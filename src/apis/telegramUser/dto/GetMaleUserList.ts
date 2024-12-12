import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetMaleUserList {
    @Property()
    telegramId!: number;
    @Property()
    username!: string;
    @Property()
    gender!: string;
    @Property()
    age!: number;
    @Property()
    avatar!: string;
    @Property()
    videos!: string;
    @Property()
    hasLiked!: boolean;
}

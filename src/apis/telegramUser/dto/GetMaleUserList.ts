import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetMaleUserList {
    @Property()
    telegramId!: string;
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
    @Property()
    followers!: number;
    @Property()
    holders!: number;
    @Property()
    activeTime!: string;
}
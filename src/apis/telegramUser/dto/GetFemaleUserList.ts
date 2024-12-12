import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetFemaleUserList {
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
    title!: string;
    @Property()
    address!: string;
    @Property()
    datingTime!: number;
    @Property()
    hasOffered!: boolean;
    @Property()
    hasLiked!: boolean;
    @Property()
    hasAccepted!: boolean;
}

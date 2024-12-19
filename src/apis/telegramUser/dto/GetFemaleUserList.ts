import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetFemaleUserList {
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
    title!: string;
    @Property()
    address!: string;
    @Property()
    datingTime!: string;
    @Property()
    hasOffered!: boolean;
    @Property()
    hasLiked!: boolean;
    @Property()
    hasAccepted!: boolean;
    @Property()
    place!: string;
    @Property()
    numLikes!: number;
    @Property()
    salary!: number;
    @Property()
    workingPlace!: string;
    @Property()
    relationshipType!: string;
    @Property()
    bio!: string;
}

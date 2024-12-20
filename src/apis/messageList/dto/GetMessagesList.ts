import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetMessagesList {
    @Property()
    telegramIdMale!: number;
    @Property()
    telegramIdFemale!: number;
    @Property()
    username!: string;
    @Property()
    avatarFemale!: string;
    @Property()
    status!: string;
    @Property()
    isPending!: boolean;
    @Property()
    chatURL!: string;
    @Property()
    title!: string;
    @Property()
    address!: string;
    @Property()
    datingTime!: string;
    @Property()
    hasDated!: boolean;
}
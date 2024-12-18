import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetMessagesList {
    @Property()
    telegramIdMale!: string;
    @Property()
    telegramIdFemale!: string;
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
    datingTime!: number;
    @Property()
    hasDated!: boolean;
}
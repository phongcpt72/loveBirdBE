import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetMessagesList {
    @Property()
    telegramIdMale!: number;
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
}
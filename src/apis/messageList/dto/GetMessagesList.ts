import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class GetMessagesList {
    @Property()
    telegramIdMale!: number;
    @Property()
    telegramIdFemale!: string;
    @Property()
    gender!: string;
    @Property()
    age!: number;
    @Property()
    avatar!: string;
    @Property()
    videos!: string;
}

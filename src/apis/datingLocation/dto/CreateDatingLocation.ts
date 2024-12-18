import { Property, Required, MaxLength, MinLength } from "@tsed/schema";

export class CreateDatingLocation {
    @Property()
    telegramIdMale!: string;
    @Property()
    telegramIdFemale!: string;
    @Property()
    title!: string;
    @Property()
    address!: string;
    @Property()
    lat!: string;
    @Property()
    long!: string;
    @Property()
    datingTime!: number;
}
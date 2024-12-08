import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { DatingInformationRepository } from "../../../dal";
import { DatingInformation } from "../../../dal/entity/DatingInformation";
import { CreateDatingLocation } from "../dto/CreateDatingLocation";
@Injectable()
export class DatingInformationService {

    @Inject(DatingInformationRepository)
    private readonly datingInformationRepository: DatingInformationRepository;


   async createDatingLocation(datingInformation: CreateDatingLocation): Promise<boolean> {
    try {
        // Check for existing records with the same telegram IDs
        const existingRecord = await this.datingInformationRepository.findOne({
            where: [
                { telegramIdFemale: datingInformation.telegramIdFemale },
                { telegramIdMale: datingInformation.telegramIdMale }
            ]
        });

        if (existingRecord) {
            console.error('Telegram ID already exists in the database');
            return false;
        }

        const entity = new DatingInformation();
        entity.telegramIdMale = datingInformation.telegramIdMale;
        entity.telegramIdFemale = datingInformation.telegramIdFemale;
        entity.title = datingInformation.title;
        entity.address = datingInformation.address;
        entity.lat = datingInformation.lat;
        entity.long = datingInformation.long;
        entity.datingTime = datingInformation.datingTime;

        await this.datingInformationRepository.save(entity);
        return true;

    } catch (error) {
        console.error('Error creating dating location:', error);
        return false;
    }

   }

}


import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { DatingInformationRepository, TelegramUserRepository } from "../../../dal";
import { DatingInformation } from "../../../dal/entity/DatingInformation";
import { CreateDatingLocation } from "../dto/CreateDatingLocation";
import axios from "axios";

@Injectable()
export class DatingInformationService {

    @Inject(DatingInformationRepository)
    private readonly datingInformationRepository: DatingInformationRepository;

    @Inject(TelegramUserRepository)
    private readonly telegramUserRepository: TelegramUserRepository;


   async createDatingLocation(datingInformation: CreateDatingLocation): Promise<boolean> {
    try {
        console.log(datingInformation);
        const entity = new DatingInformation();
        entity.telegramIdMale = datingInformation.telegramIdMale;
        entity.telegramIdFemale = datingInformation.telegramIdFemale;
        entity.title = datingInformation.title;
        entity.address = datingInformation.address;
        entity.lat = datingInformation.lat;
        entity.long = datingInformation.long;
        entity.datingTime = datingInformation.datingTime;
        entity.hasDated = false;
        await this.datingInformationRepository.save(entity);

        await this.sendMessageAfterConfirmDating(datingInformation.telegramIdFemale);
       
        return true;

    } catch (error) {
        console.error('Error creating dating location:', error);
        return false;
    }
   } 
   
   async sendMessageAfterConfirmDating(telegramIdFemale: string): Promise<boolean> {
    // Updated URL to set chat menu button
    const urlForFemale = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const dataForFemale = {
        chat_id: telegramIdFemale,
        text: "Some just proposed you a date",
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Check now!",
                        web_app: {
                            url: `https://staging.lvbrd.uk/dating/${telegramIdFemale}/messages`
                        }
                    }
                ]
            ]
        }
    };

    try {
        const [femaleResponse] = await Promise.all([
            axios.post(urlForFemale, dataForFemale, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
        ]);
        
        // Check if the requests were successful
        if (femaleResponse.status === 200) {
            return true;
        }

        console.error('Failed to send messages:', {
            femaleStatus: femaleResponse.status
        });

        return false;
    } catch (requestError) {
        console.error('Failed to send Telegram messages:', requestError);
        return false;
    }
}


    async getDateAndLocation(telegramIdMale: string, telegramIdFemale: string): Promise<{title: string,address :string,formattedDate: string, formattedTime: string,datingTime: string, hasDated: boolean} | null> {
        try {
        const datingLocation = await this.datingInformationRepository.findOne({
            select: ["title","address", "datingTime","hasDated"],
            where: { telegramIdMale, telegramIdFemale }
        });

        if (datingLocation) {
            // Convert the datingTime string to a Date object
            const datingTime = new Date(Number(datingLocation.datingTime) * 1000);
            console.log("datingTime");
            console.log(datingTime);
            const { formattedDate, formattedTime } = await this.formatDateTime(datingTime.toString());
            return { title: datingLocation.title, address: datingLocation.address, formattedDate, formattedTime, datingTime: datingLocation.datingTime, hasDated: datingLocation.hasDated };
        }

        return null;
        } catch (error) {
            console.error('Error getting dating location:', error);
            return null;
        }
    } 

    async formatDateTime(dateString: string): Promise<{ formattedDate: string, formattedTime: string }> {
        const date = new Date(dateString);
        const day = date.getDate();
        const daySuffix = (day: number) => {
            if (day > 3 && day < 21) return 'th'; // covers 11th to 19th
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
        const formattedDate = new Intl.DateTimeFormat('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric', 
            timeZone: 'Asia/Ho_Chi_Minh' 
        }).format(date);
        const [month, dayNumber, year] = formattedDate.replace(',', '').split(' ');
        const formattedDateWithSuffix = `${month} ${dayNumber}${daySuffix(day)} ${year}`;
    
        const formattedTime = new Intl.DateTimeFormat('en-US', { 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true, 
            timeZone: 'Asia/Ho_Chi_Minh' 
        }).format(date);
        return { formattedDate: formattedDateWithSuffix, formattedTime };
    }

    async updateHasDated(telegramIdMale: string, telegramIdFemale: string): Promise<boolean> {
        try {
            await this.datingInformationRepository.update({ telegramIdMale, telegramIdFemale }, { hasDated: true });
            return true;
        } catch (error) {
            console.error('Error updating hasDated:', error);
            return false;
        }
    }

}


import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { MessageListRepository, MessageList } from "../../../dal";
import { TelegramUserService } from "../../telegramUser/services/telegramUserSevice";
@Injectable()
export class MessageListService {

    @Inject()
    private readonly telegramUserService: TelegramUserService;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    async getMessagesList(telegramId: number): Promise<{
        telegramIdMale: number | null;
        telegramIdFemale: number | null;
        username: string | null;
        avatarFemale: string | null;
        status: string | null;
        isPending: boolean;
    } | null> {
        try {
            if (telegramId === undefined) {
                return { telegramIdMale: null, telegramIdFemale: null, username: null, avatarFemale: null, status: null, isPending: false };
            }
            const user = await this.messageListRepository.findOne({
                select: ["telegramIdFemale","status","isPending"],
                where: { telegramIdMen: telegramId }
            });
            
            console.log(user?.telegramIdFemale)
            const {userName,avatar} = await this.telegramUserService.getUserNameAndAvatar(user?.telegramIdFemale ?? 0);

            if(user){
                return { telegramIdMale: telegramId, telegramIdFemale: user.telegramIdFemale, username:userName , avatarFemale: avatar, status: user.status, isPending: user.isPending  };
            }
            
            return { telegramIdMale: null, telegramIdFemale: null, username: null, avatarFemale: null, status: null, isPending: false  };
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return { telegramIdMale: null, telegramIdFemale: null, username: null, avatarFemale: null, status: null, isPending: false  };
        }
    }

}




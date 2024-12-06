import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { MessageListRepository, MessageList } from "../../../dal";
import { TelegramUserService } from "../../telegramUser/services/telegramUserSevice";
import { GetMessagesList } from "../dto/GetMessagesList";

@Injectable()
export class MessageListService {

    @Inject()
    private readonly telegramUserService: TelegramUserService;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    // async getMessagesList(telegramId: number): Promise<GetMessagesList[]> {
    //     try {
    //         if (telegramId === undefined) {
    //             return[];
    //         }
    //         const users = await this.messageListRepository.find({
    //             select: ["telegramIdFemale","status","isPending"],
    //             where: { telegramIdMen: telegramId }
    //         });

    //         console.log(users)
    //         //const {userName,avatar} = await this.telegramUserService.getUserNameAndAvatar(users);

    //         const userMessagesList: GetMessagesList[] = [];
            
    //         return [];
    //     } catch (error) {
    //         console.error("Error retrieving Telegram user information:", error);
    //         return [];
    //     }
    // }

}




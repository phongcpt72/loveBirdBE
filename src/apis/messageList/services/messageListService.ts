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

    async getMessagesList(telegramId: number): Promise<GetMessagesList[]> {
        try {
            if (telegramId === undefined) {
                return[];
            }
            const users = await this.messageListRepository.find({
                select: ["telegramIdFemale","status","isPending"],
                where: { telegramIdMen: telegramId },
                order: { created_at: "DESC" }
            });

            const result = await this.telegramUserService.getUserNameAndAvatar(users.map(user => user.telegramIdFemale));
            
            // Combine users and result arrays
            const userMessagesList: GetMessagesList[] = users.map((user, index) => ({
                telegramIdMale: telegramId,
                telegramIdFemale: user.telegramIdFemale.toString(),
                username: result[index]?.userName || '',
                avatarFemale: result[index]?.avatar || '',
                status: user.status,
                isPending: user.isPending
            }));
            return userMessagesList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }
}




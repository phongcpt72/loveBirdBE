import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { MessageListRepository, MessageList, GroupChatLinkRepository } from "../../../dal";
import { TelegramUserService } from "../../telegramUser/services/telegramUserSevice";
import { GetMessagesList } from "../dto/GetMessagesList";

@Injectable()
export class MessageListService {

    @Inject()
    private readonly telegramUserService: TelegramUserService;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    @Inject(GroupChatLinkRepository)
    private readonly groupChatLinkRepository: GroupChatLinkRepository;

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
            

            const txHashs = await this.getGroupChatLinkByTxHash(telegramId, users.map(user => user.telegramIdFemale));

            const chatURLs = await this.getGroupChatLink(txHashs);
            
            // Combine users and result arrays
            const userMessagesList: GetMessagesList[] = users.map((user, index) => ({
                telegramIdMale: telegramId,
                telegramIdFemale: user.telegramIdFemale,
                username: result[index]?.userName || '',
                avatarFemale: result[index]?.avatar || '',
                status: user.status,
                isPending: user.isPending,
                chatURL: chatURLs[index] || ''
            }));
            return userMessagesList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async getGroupChatLink(txHash: string[]): Promise<string[]> {
        const result = await this.groupChatLinkRepository.find({
            select: ["link"],
            where: { txHash: In(txHash) }
        });
        return result.map(msg => msg.link);
    }

    async getGroupChatLinkByTxHash(telegramIdMale: number, telegramIdFemale: number[]): Promise<string[]> {
        const result = await this.messageListRepository.find({
            select: ["txHash"],
            where: { telegramIdMen: telegramIdMale, telegramIdFemale: In(telegramIdFemale) }
        });
        return result.map(msg => msg.txHash);
    }
}




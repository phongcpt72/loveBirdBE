import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { MessageListRepository, MessageList, GroupChatLinkRepository } from "../../../dal";
import { TelegramUserService } from "../../telegramUser/services/telegramUserSevice";
import { GetMessagesList } from "../dto/GetMessagesList";
import { DatingInformationService } from "../../datingLocation/services/DatingInformationService";
import axios from 'axios';


@Injectable()
export class MessageListService {

    @Inject(TelegramUserService)
    private readonly telegramUserService: TelegramUserService;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    @Inject(GroupChatLinkRepository)
    private readonly groupChatLinkRepository: GroupChatLinkRepository;

    @Inject(DatingInformationService)
    private readonly datingInformationService: DatingInformationService;

    async getMessagesList(telegramId: string): Promise<GetMessagesList[]> {
        try {
            if (!telegramId ) {
                return [];
            }
    
            const gender = await this.telegramUserService.getGender(telegramId);
    
            let users;
            if (gender === 'M') {
                users = await this.messageListRepository.find({
                    select: ["telegramIdFemale", "status", "isPending"],
                    where: { telegramIdMale: telegramId },
                    order: { created_at: "DESC" }
                });
            } else if (gender === 'F') {
                users = await this.messageListRepository.find({
                    select: ["telegramIdMale", "status", "isPending"],
                    where: { telegramIdFemale: telegramId },
                    order: { created_at: "DESC" }
                });
            } else {
                return [];
            }
    
            const userIds = users.map(user => gender === 'M' ? user.telegramIdFemale : user.telegramIdMale);
            const result = await this.telegramUserService.getUserNameAndAvatar(userIds);
    
            const txHashs = await this.getGroupChatLinkByTxHash(telegramId, userIds);
            console.log(txHashs);
            const chatURLs = await this.getGroupChatLink(txHashs);
            console.log(chatURLs);

            const userMessagesList: GetMessagesList[] = await Promise.all(users.map(async (user, index) => {
                const telegramIdMale = gender === 'M' ? telegramId : user.telegramIdMale;
                const telegramIdFemale = gender === 'M' ? user.telegramIdFemale : telegramId;
                
                const datingInfo = await this.datingInformationService.getDateAndLocation(telegramIdMale, telegramIdFemale);

                return {
                    telegramIdMale,
                    telegramIdFemale,
                    username: result[index]?.userName || '',
                    avatarFemale: result[index]?.avatar || '',
                    status: user.status,
                    isPending: user.isPending,
                    chatURL: chatURLs[index] || '',
                    title: datingInfo?.title || '',
                    address: datingInfo?.address || '',
                    datingTime: datingInfo?.datingTime || '',
                    hasDated: datingInfo?.hasDated || false
                };
            }));
            return userMessagesList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async getMessageListMale(telegramId: string): Promise<GetMessagesList[]> {
        try {
            if (!telegramId) {
                return [];
            }

            const users = await this.messageListRepository.find({
                select: ["telegramIdFemale", "status", "isPending"],
                where: { telegramIdMale: telegramId },
                order: { created_at: "DESC" }
            });

            const userIds = users.map(user => user.telegramIdFemale);
            const result = await this.telegramUserService.getUserNameAndAvatar(userIds);

            const txHashs = await this.getGroupChatLinkByTxHash(telegramId, userIds);
            const chatURLs = await this.getGroupChatLink(txHashs);

            const userMessagesList: GetMessagesList[] = await Promise.all(users.map(async (user, index) => {
                const datingInfo = await this.datingInformationService.getDateAndLocation(telegramId, user.telegramIdFemale);

                return {
                    telegramIdMale: telegramId,
                    telegramIdFemale: user.telegramIdFemale,
                    username: result[index]?.userName || '',
                    avatarFemale: result[index]?.avatar || '',
                    status: user.status,
                    isPending: user.isPending,
                    chatURL: chatURLs[index] || '',
                    title: datingInfo?.title || '',
                    address: datingInfo?.address || '',
                    datingTime: datingInfo?.datingTime || '',
                    hasDated: datingInfo?.hasDated || false
                };
            }));

            return userMessagesList;

        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async getMessageListFemale(telegramId: string): Promise<GetMessagesList[]> {
        try {
            if (!telegramId) {
                return [];
            }

            const users = await this.messageListRepository.find({
                select: ["telegramIdMale", "status", "isPending"],
                where: { telegramIdFemale: telegramId },
                order: { created_at: "DESC" }
            });

            const userIds = users.map(user => user.telegramIdMale);
            const result = await this.telegramUserService.getUserNameAndAvatar(userIds);

            const txHashs = await this.getGroupChatLinkByTxHashFemale(telegramId, userIds);
            const chatURLs = await this.getGroupChatLink(txHashs);

            const userMessagesList: GetMessagesList[] = await Promise.all(users.map(async (user, index) => {
                const datingInfo = await this.datingInformationService.getDateAndLocation(user.telegramIdMale, telegramId);

                return {
                    telegramIdMale: user.telegramIdMale,
                    telegramIdFemale: telegramId,
                    username: result[index]?.userName || '',
                    avatarFemale: result[index]?.avatar || '',
                    status: user.status,
                    isPending: user.isPending,
                    chatURL: chatURLs[index] || '',
                    title: datingInfo?.title || '',
                    address: datingInfo?.address || '',
                    datingTime: datingInfo?.datingTime || '',
                    hasDated: datingInfo?.hasDated || false
                };
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

    async getGroupChatLinkByTxHash(telegramIdMale: string, telegramIdFemale: string[]): Promise<string[]> {
        const result = await this.messageListRepository.find({
            select: ["txHash"],
            where: { telegramIdMale: telegramIdMale, telegramIdFemale: In(telegramIdFemale) }
        });
        return result.map(msg => msg.txHash);
    }

    async getGroupChatLinkByTxHashFemale(telegramIdFemale: string, telegramIdMale: string[]): Promise<string[]> {
        const result = await this.messageListRepository.find({
            select: ["txHash"],
            where: { telegramIdFemale: telegramIdFemale, telegramIdMale: In(telegramIdMale) }
        });
        return result.map(msg => msg.txHash);
    }


    


}




import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { MessageListRepository, MessageList, GroupChatLinkRepository } from "../../../dal";
import { TelegramUserService } from "../../telegramUser/services/telegramUserSevice";
import { GetMessagesList } from "../dto/GetMessagesList";
import { DatingInformationService } from "../../datingLocation/services/DatingInformationService";

@Injectable()
export class MessageListService {

    @Inject()
    private readonly telegramUserService: TelegramUserService;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    @Inject(GroupChatLinkRepository)
    private readonly groupChatLinkRepository: GroupChatLinkRepository;

    @Inject()
    private readonly datingInformationService: DatingInformationService;


    async getMessagesList(telegramId: number): Promise<GetMessagesList[]> {
        try {
            this.getMessageListFemale(telegramId);
            if (telegramId === undefined) {
                return [];
            }
    
            const gender = await this.telegramUserService.getGender(telegramId);
    
            let users;
            if (gender === 'M') {
                users = await this.messageListRepository.find({
                    select: ["telegramIdFemale", "status", "isPending"],
                    where: { telegramIdMen: telegramId },
                    order: { created_at: "DESC" }
                });
            } else if (gender === 'F') {
                users = await this.messageListRepository.find({
                    select: ["telegramIdMen", "status", "isPending"],
                    where: { telegramIdFemale: telegramId },
                    order: { created_at: "DESC" }
                });
            } else {
                return [];
            }
    
            const userIds = users.map(user => gender === 'M' ? user.telegramIdFemale : user.telegramIdMen);
            const result = await this.telegramUserService.getUserNameAndAvatar(userIds);
    
            const txHashs = await this.getGroupChatLinkByTxHash(telegramId, userIds);
            console.log(txHashs);
            const chatURLs = await this.getGroupChatLink(txHashs);
            console.log(chatURLs);

            const userMessagesList: GetMessagesList[] = await Promise.all(users.map(async (user, index) => {
                const telegramIdMale = gender === 'M' ? telegramId : user.telegramIdMen;
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
                    datingTime: datingInfo?.datingTime || 0,
                    hasDated: datingInfo?.hasDated || false
                };
            }));
            return userMessagesList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async getMessageListMale(telegramId: number): Promise<GetMessagesList[]> {
        try{
            if(telegramId === undefined){
                return [];
            }
            const users = await this.messageListRepository.find({
                select: ["telegramIdFemale", "status", "isPending"],
                where: { telegramIdMen: telegramId },
                order: { created_at: "DESC" }
            });

            const userIds = users.map(user => user.telegramIdFemale);
            const result = await this.telegramUserService.getUserNameAndAvatar(userIds);

            const txHashs = await this.getGroupChatLinkByTxHash(telegramId, userIds);
            // console.log(txHashs);
            const chatURLs = await this.getGroupChatLink(txHashs);
            // console.log(chatURLs);

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
                    datingTime: datingInfo?.datingTime || 0,
                    hasDated: datingInfo?.hasDated || false
                };
            }));
            console.log(userMessagesList);
            return userMessagesList;

        }catch(error){
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async getMessageListFemale(telegramId: number): Promise<GetMessagesList[]> {
        try{
            if(telegramId === undefined){
                return [];
            }
            const users = await this.messageListRepository.find({
                select: ["telegramIdMen", "status", "isPending"],
                where: { telegramIdFemale: telegramId },
                order: { created_at: "DESC" }
            });

            const userIds = users.map(user => user.telegramIdMen);
            console.log(userIds);
            const result = await this.telegramUserService.getUserNameAndAvatar(userIds);

            const txHashs = await this.getGroupChatLinkByTxHashFemale(telegramId, userIds);
            console.log(txHashs);

            const chatURLs = await this.getGroupChatLink(txHashs);
            console.log(chatURLs);

            const userMessagesList: GetMessagesList[] = await Promise.all(users.map(async (user, index) => {
                const datingInfo = await this.datingInformationService.getDateAndLocation(telegramId, user.telegramIdMen);
                return {
                    telegramIdMale: user.telegramIdMen,
                    telegramIdFemale: telegramId,
                    username: result[index]?.userName || '',
                    avatarFemale: result[index]?.avatar || '',
                    status: user.status,
                    isPending: user.isPending,
                    chatURL: chatURLs[index] || '',
                    title: datingInfo?.title || '',
                    address: datingInfo?.address || '',
                    datingTime: datingInfo?.datingTime || 0,
                    hasDated: datingInfo?.hasDated || false
                };
            }));
            console.log(userMessagesList);
            return userMessagesList;

        }catch(error){
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

    async getGroupChatLinkByTxHashFemale(telegramIdFemale: number, telegramIdMale: number[]): Promise<string[]> {
        const result = await this.messageListRepository.find({
            select: ["txHash"],
            where: { telegramIdFemale: telegramIdFemale, telegramIdMen: In(telegramIdMale) }
        });
        return result.map(msg => msg.txHash);
    }
}




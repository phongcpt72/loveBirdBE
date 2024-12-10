import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { CreateTelegramUserDto } from "../dto/CreateTelegramUserDto";
import { MessageListRepository, TelegramUser, TelegramUserRepository } from "../../../dal";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";
import { GetUserList } from "../dto/GetUserList";
import { PaymentService } from "../../payment/services/paymentService";

@Injectable()
export class TelegramUserService {


    @Inject(TelegramUserRepository)
    private readonly telegramUserRepository: TelegramUserRepository;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    @Inject(PaymentService)
    private readonly paymentService: PaymentService;

    async createTelegramUser(telegramId: number, gender: string, username: string, age: number): Promise<boolean> {   
        const entity = new TelegramUser();
        const wallet = await this.createWallet();
        // Map properties from the request DTO to the entity
        entity.telegramId = telegramId;
        entity.gender = gender;
        entity.userName = username;
        entity.age = age;
        entity.publicKey = wallet.publicKey;
        entity.privateKey = wallet.privateKey;
        
        try {
            // Save the entity to the database
            await this.telegramUserRepository.save(entity);
            return true;
        } catch (error) {
            // Log the error if necessary
            console.error("Failed to save Telegram user:", error);
            return false;
        }
    }

    async createWallet():Promise<{privateKey: string,publicKey: string}>
    {
        // Generate a new random wallet
        const wallet = Wallet.createRandom();
        const walletKey = new ethers.Wallet(wallet.privateKey);
        const publicKey = walletKey.address;
        const privateKey= wallet.privateKey;
        return{privateKey,publicKey}
    }

    async getGender(telegramId: number): Promise<string> {
        const user = await this.telegramUserRepository.findOne({ where: { telegramId } });
        return user?.gender || '';
    }

    async getUserNameAndAvatar(telegramIds: number[]): Promise<Array<{ userName: string | null, avatar: string | null }>> {
        const users = await this.telegramUserRepository.find({
            select: ["telegramId","userName", "avatar"],
            where: { telegramId: In(telegramIds) }
        });
        return telegramIds.map(id => {
            const user = users.find(u => u.telegramId === id);
            return {
                userName: user?.userName || null,
                avatar: user?.avatar || null
            };
        });
    }

    async getTelegramUser(telegramId: number): Promise<{ 
        telegramId: number | null;
        username: string | null; 
        gender: string | null; 
        age: number | null; 
        avatar: string | null;
        publicKey: string | null;
        balance: string | null;
    } | null> {
        try {
            if (telegramId === undefined) {
                return { telegramId: null, username: null, gender: null, age: null, avatar: null, publicKey: null, balance: null };
            }
            const user = await this.telegramUserRepository.findOne({
                select: ["userName", "gender", "age", "avatar","publicKey"],
                where: { telegramId }
            });

            if (user) {
                const { userName: username, gender, age, avatar, publicKey } = user;
                const balance = await this.paymentService.getBalance(publicKey);
                console.log(user);
                console.log(balance);
                return { telegramId, username, gender, age, avatar, publicKey, balance: balance.toString() };
            }
            
            return { telegramId: null, username: null, gender: null, age: null, avatar: null, publicKey: null, balance: null };
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return { telegramId: null, username: null, gender: null, age: null, avatar: null, publicKey: null, balance: null };
        }
    }

    async filterUserList(telegramId: number, gender: string): Promise<{ telegramIdFilter: number[] }> {
        const users = await this.messageListRepository.find({
            select: [gender === 'F' ? "telegramIdMen" : "telegramIdFemale"],
            where: {
                [gender === 'F' ? "telegramIdFemale" : "telegramIdMen"]: telegramId
            }
        });
        const telegramIds = users.map(user => 
            gender === 'F' ? user.telegramIdMen : user.telegramIdFemale
        );
        return { telegramIdFilter: telegramIds };
    }


    async getUserList(telegramId: number): Promise<GetUserList[]> {
        try {
            const currentUser = await this.telegramUserRepository.findOne({ where: { telegramId } });
            if (!currentUser) {
                console.error("User not found with the given telegramId");
                return [];
            }
            const oppositeGender = currentUser.gender === 'F' ? 'M' : 'F';
            const { telegramIdFilter } = await this.filterUserList(telegramId, currentUser.gender);

            const users = await this.telegramUserRepository.find({
                select: ["telegramId", "userName", "gender", "age", "avatar", "videos"],
                where: {
                    gender: oppositeGender,
                    telegramId: telegramIdFilter.length > 0 
                        ? currentUser.gender === 'M' 
                            ? Not(In(telegramIdFilter)) 
                            : In(telegramIdFilter)
                        : undefined
                }
            });

            const userList: GetUserList[] = users.map(user => ({
                telegramId: user.telegramId,
                username: user.userName, 
                gender: user.gender,
                age: user.age,
                avatar: user.avatar,
                videos: user.videos
            }));
            return userList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

}

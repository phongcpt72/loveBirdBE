import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull, ArrayContains} from "typeorm";
import { CreateTelegramUserDto } from "../dto/CreateTelegramUserDto";
import { MessageListRepository, TelegramUser, TelegramUserRepository, MessageList } from "../../../dal";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";
import { GetUserList } from "../dto/GetUserList";
import { PaymentService } from "../../payment/services/paymentService";
import { DatingInformationService } from "../../datingLocation/services/DatingInformationService";

@Injectable()
export class TelegramUserService {


    @Inject(TelegramUserRepository)
    private readonly telegramUserRepository: TelegramUserRepository;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    @Inject(PaymentService)
    private readonly paymentService: PaymentService;

    @Inject(DatingInformationService)
    private readonly datingInformationService: DatingInformationService;

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
        entity.likedUsers = [];
        
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

            let users: TelegramUser[] = [];
            
            if (currentUser.gender === 'M') {
                // For men:
                // 1. Get women who have liked them
                const usersWhoLikedMe = await this.telegramUserRepository
                    .createQueryBuilder('user')
                    .where('user.gender = :gender', { gender: 'F' })
                    .andWhere(':telegramId = ANY(string_to_array(user.likedUsers, \',\')::integer[])', { telegramId })
                    .getMany();
                // Rest of the code remains the same
                const womenNotInMessageList = await this.telegramUserRepository.find({
                    where: {
                        gender: 'F',
                        telegramId: Not(In([
                            ...telegramIdFilter,
                            ...usersWhoLikedMe.map(u => u.telegramId)
                        ]))
                    }
                });
                // 3. Combine the lists: first liked users, then users not in message list
                users = [...usersWhoLikedMe, ...womenNotInMessageList];
                // users = await this.getMaleUserList(telegramId, telegramIdFilter);
                // console.log(userListTest);
            } else {
                // For women, behavior remains the same
                users = await this.telegramUserRepository.find({
                    where: {
                        gender: oppositeGender,
                        ...(telegramIdFilter.length > 0 && { telegramId: In(telegramIdFilter) })
                    }
                });
            }

            const userList: GetUserList[] = await Promise.all(users.map(async user => {
                const datingInfo = await this.datingInformationService.getDateAndLocation(
                    currentUser.gender === 'M' ? currentUser.telegramId : user.telegramId,
                    currentUser.gender === 'F' ? currentUser.telegramId : user.telegramId
                );
                
                return {
                    telegramId: user.telegramId,
                    username: user.userName,
                    gender: user.gender,
                    age: user.age,
                    avatar: user.avatar,
                    videos: user.videos,
                    title: datingInfo?.title || '',
                    address: datingInfo?.address || '',
                    datingTime: `${datingInfo?.formattedDate || ''} ${datingInfo?.formattedTime || ''}`.trim(),
                    hasLiked:  user.likedUsers?.includes(`${currentUser.telegramId}`) || false

                };
            }));

            return userList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async getMaleUserList(telegramId: number, telegramIdFilter: number[]): Promise<TelegramUser[]> {
        let users: TelegramUser[];

        const usersWhoLikedMe = await this.telegramUserRepository
            .createQueryBuilder('user')
            .where('user.gender = :gender', { gender: 'F' })
            .andWhere(':telegramId = ANY(string_to_array(user.likedUsers, \',\')::integer[])', { telegramId })
            .getMany();
        
        const womenNotInMessageList = await this.telegramUserRepository.find({
            where: {
                gender: 'F',
                telegramId: Not(In([
                    ...telegramIdFilter,
                    ...usersWhoLikedMe.map(u => u.telegramId)
                ]))
            }
        });

        users = [...usersWhoLikedMe, ...womenNotInMessageList];
        return users;
    }

    async likeUser(telegramId: number, likedTelegramId: number): Promise<boolean> {
        const user = await this.telegramUserRepository.findOne({ where: { telegramId } });
        if (!user) {
            return false;
        }
        
        if (!user.likedUsers) {
            user.likedUsers = [];
        }
        user.likedUsers.push(likedTelegramId.toString());
        await this.telegramUserRepository.save(user);
        return true;
    }

}

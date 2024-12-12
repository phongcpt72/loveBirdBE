import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull, ArrayContains} from "typeorm";
import { CreateTelegramUserDto } from "../dto/CreateTelegramUserDto";
import { MessageListRepository, TelegramUser, TelegramUserRepository, MessageList } from "../../../dal";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";
import { GetFemaleUserList } from "../dto/GetFemaleUserList";
import { GetMaleUserList } from "../dto/GetMaleUserList";
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
        // Get the QueryRunner from the repository's manager
        const queryRunner = this.telegramUserRepository.manager.connection.createQueryRunner();
        
        // Start transaction
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            const currentUser = await this.telegramUserRepository.findOne({ where: { telegramId } });
            if (currentUser) {
                console.error("User already exists");
                return false;
            }
            const entity = new TelegramUser();
            const wallet = await this.createWallet();
            
            entity.telegramId = telegramId;
            entity.gender = gender;
            entity.userName = username;
            entity.age = age;
            entity.publicKey = wallet.publicKey;
            entity.privateKey = wallet.privateKey;
            entity.likedUsers = [];
            
            // Save using the queryRunner manager
            await queryRunner.manager.save(entity);
            
            // Commit the transaction
            await queryRunner.commitTransaction();
            return true;
        } catch (error) {
            // Rollback the transaction on error
            await queryRunner.rollbackTransaction();
            console.error("Failed to save Telegram user:", error);
            return false;
        } finally {
            // Release the queryRunner
            await queryRunner.release();
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


    async getMaleUserList(telegramId: number): Promise<GetMaleUserList[]> {
        try {
            const currentUser = await this.telegramUserRepository.findOne({ where: { telegramId } });
            if (!currentUser) {
                console.error("User not found with the given telegramId");
                return [];
            }
            const { telegramIdFilter } = await this.filterUserList(telegramId, currentUser.gender);

            let users: TelegramUser[] = [];
            
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
            const userList: GetMaleUserList[] = await Promise.all(users.map(async user => {
                return {
                    telegramId: user.telegramId,
                    username: user.userName,
                    gender: user.gender,
                    age: user.age,
                    avatar: user.avatar,
                    videos: user.videos,
                    hasLiked:  user.likedUsers?.includes(`${currentUser.telegramId}`) || false

                };
            }));

            return userList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async getFemaleUserList(telegramId: number): Promise<GetFemaleUserList[]> {
        try {
            const currentUser = await this.telegramUserRepository.findOne({ where: { telegramId } });
            if (!currentUser) {
                console.error("User not found with the given telegramId");
                return [];
            }

            const allMaleUsers = await this.telegramUserRepository.find({
                where: { 
                    gender: 'M'
            }
            });
            
            const hasOffered = await this.messageListRepository.find({
                select: ["telegramIdMen"],
                where: {
                    telegramIdFemale: telegramId,
                }
            });

            const hasAccepted = await this.messageListRepository.find({
                select: ["telegramIdMen"],
                where: {
                    telegramIdFemale: telegramId,
                    hasAccepted: true
                }
            });

            const offeredMenIds = hasOffered.map(offer => offer.telegramIdMen);
            const acceptedMenIds = hasAccepted.map(accept => accept.telegramIdMen);
            console.log(offeredMenIds);


            const userList: GetFemaleUserList[] = await Promise.all(
                allMaleUsers
                    .filter(user => !acceptedMenIds.includes(user.telegramId)) // Filter out accepted users
                    .map(async (user) => {
                        const datingInfo = await this.datingInformationService.getDateAndLocation(user.telegramId, telegramId);
                        return {
                            telegramId: user.telegramId,
                            username: user.userName,
                            gender: user.gender,
                            age: user.age,
                            avatar: user.avatar,
                            videos: user.videos,
                            title: datingInfo?.title || '',
                            address: datingInfo?.address || '',
                            datingTime: datingInfo?.datingTime || 0,
                            hasLiked: currentUser.likedUsers?.includes(`${user.telegramId}`) || false,
                            hasOffered: offeredMenIds.includes(user.telegramId)
                        };
                    })
            );
            // Sort the userList - users with hasOffered=true will appear first
            userList.sort((a, b) => (b.hasOffered ? 1 : 0) - (a.hasOffered ? 1 : 0));
            return userList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    async likeUser(telegramId: number, likedTelegramId: number): Promise<boolean> {
        // Get the QueryRunner from the repository's manager
        const queryRunner = this.telegramUserRepository.manager.connection.createQueryRunner();
        
        // Start transaction
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {   
            const user = await queryRunner.manager.findOne(TelegramUser, { 
                where: { telegramId } 
            });
            
            if (!user) {
                return false;
            }
            
            if (!user.likedUsers) {
                user.likedUsers = [];
            }

            // Check if user has already liked this telegramId
            if (user.likedUsers.includes(likedTelegramId.toString())) {
                return false;
            }

            user.likedUsers.push(likedTelegramId.toString());
            await queryRunner.manager.save(user);
            
            // Commit the transaction
            await queryRunner.commitTransaction();
            return true;
        } catch (error) {
            // Rollback the transaction on error
            await queryRunner.rollbackTransaction();
            console.error("Error liking user:", error);
            return false;
        } finally {
            // Release the queryRunner
            await queryRunner.release();
        }
    }

}

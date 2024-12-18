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

    async createTelegramUser(telegramId: string, gender: string, username: string, age: number): Promise<boolean> {   
        
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
            entity.place = "Vietnam";
            entity.numLikes = 0;
            entity.salary = 0;
            entity.workingPlace = "";
            entity.relationshipType = "";
            entity.bio = "";
            // Save using the queryRunner manager
            await this.telegramUserRepository.save(entity);
            return true;
        } catch (error) {
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

    async getGender(telegramId: string): Promise<string> {
        const user = await this.telegramUserRepository.findOne({ where: { telegramId } });
        return user?.gender || '';
    }

    async getUserNameAndAvatar(telegramIds: string[]): Promise<Array<{ userName: string | null, avatar: string | null }>> {
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

    async getTelegramUser(telegramId: string): Promise<{ 
        telegramId: string | null;
        username: string | null; 
        gender: string | null; 
        age: number | null; 
        avatar: string | null;
        publicKey: string | null;
        balance: string | null;
        videos: string | null;
    } | null> {
        try {
            console.log(`getTelegramUser ${telegramId}`);
            if (telegramId === undefined) {
                return { telegramId: null, username: null, gender: null, age: null, avatar: null, publicKey: null, balance: null, videos: null };
            }

            const user = await this.telegramUserRepository.findOne({
                select: ["userName", "gender", "age", "avatar","publicKey","privateKey","videos"],
                where: { telegramId }
            });

            if (user) {
                const { userName: username, gender, age, avatar, publicKey, privateKey ,videos} = user;
                // const balance = await this.paymentService.getBalanceInEther(publicKey);
                // const balance = await this.paymentService.getTokenBalance(user.privateKey);
                const balance = "0";
                return { telegramId, username, gender, age, avatar, publicKey, balance: balance.toString(), videos: videos || null };
            }
            
            return { telegramId: null, username: null, gender: null, age: null, avatar: null, publicKey: null, balance: null, videos: null };
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return { telegramId: null, username: null, gender: null, age: null, avatar: null, publicKey: null, balance: null, videos: null };
        }
    }

    async filterUserList(telegramId: string, gender: string): Promise<{ telegramIdFilter: string[] }> {
        const users = await this.messageListRepository.find({
            select: [gender === 'F' ? "telegramIdMale" : "telegramIdFemale"],
            where: {
                [gender === 'F' ? "telegramIdFemale" : "telegramIdMale"]: telegramId
            }
        });
        const telegramIds = users.map(user => 
            gender === 'F' ? user.telegramIdMale : user.telegramIdFemale
        );
        return { telegramIdFilter: telegramIds };
    }

    async getMaleUserList(telegramId: string): Promise<GetMaleUserList[]> {
        try {

            console.log("GetMaleUserList");
            // Get current user and filter list in parallel
            const [currentUser, { telegramIdFilter }] = await Promise.all([
                this.telegramUserRepository.findOne({ where: { telegramId } }),
                this.filterUserList(telegramId, 'M') // Assuming current user is male
            ]);

            console.log(telegramIdFilter);
            console.log(currentUser);
            if (!currentUser) {
                console.error("User not found with the given telegramId");
                return [];
            }

            // Single query to get all relevant female users
            const allFemaleUsers = await this.telegramUserRepository
                .createQueryBuilder('user')
                .where('user.gender = :gender', { gender: 'F' })
                .andWhere('user.telegramId NOT IN (:...telegramIdFilter)', { 
                    telegramIdFilter: telegramIdFilter.length ? telegramIdFilter : [0] 
                })
                .getMany();
    
            // Process the results in memory
            const userList = allFemaleUsers.map(user => ({
                telegramId: user.telegramId,
                username: user.userName,
                gender: user.gender,
                age: user.age,
                avatar: user.avatar,
                videos: user.videos,
                hasLiked: user.likedUsers?.includes(currentUser.telegramId.toString()) || false
            }));
    
            // Sort users who liked the current user to the beginning
            return userList.sort((a, b) => {
                const aLikedMe = allFemaleUsers.find(u => u.telegramId === a.telegramId)?.likedUsers?.includes(currentUser.telegramId.toString()) ? 1 : 0;
                const bLikedMe = allFemaleUsers.find(u => u.telegramId === b.telegramId)?.likedUsers?.includes(currentUser.telegramId.toString()) ? 1 : 0;
                return bLikedMe - aLikedMe;
            });
    
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

    // async getMaleUserList(telegramId: number): Promise<GetMaleUserList[]> {
    //     try {
    //         const currentUser = await this.telegramUserRepository.findOne({ where: { telegramId } });
    //         if (!currentUser) {
    //             console.error("User not found with the given telegramId");
    //             return [];
    //         }
    //         const { telegramIdFilter } = await this.filterUserList(telegramId, currentUser.gender);

    //         let users: TelegramUser[] = [];
            
    //         const usersWhoLikedMe = await this.telegramUserRepository
    //             .createQueryBuilder('user')
    //             .where('user.gender = :gender', { gender: 'F' })
    //             .andWhere(':telegramId = ANY(string_to_array(user.likedUsers, \',\')::integer[])', { telegramId })
    //             .getMany();
    
    //         const womenNotInMessageList = await this.telegramUserRepository.find({
    //             where: {
    //                 gender: 'F',
    //                 telegramId: Not(In([
    //                     ...telegramIdFilter
    //                 ]))
    //             }
    //         });
            
    //         const filteredUsersWhoLikedMe = usersWhoLikedMe.filter(user => 
    //             womenNotInMessageList.some(w => w.telegramId === user.telegramId)
    //         );

    //         users = [...filteredUsersWhoLikedMe, ...womenNotInMessageList];
    //         const userList: GetMaleUserList[] = await Promise.all(users.map(async user => {
    //             return {
    //                 telegramId: user.telegramId,
    //                 username: user.userName,
    //                 gender: user.gender,
    //                 age: user.age,
    //                 avatar: user.avatar,
    //                 videos: user.videos,
    //                 hasLiked:  user.likedUsers?.includes(`${currentUser.telegramId}`) || false

    //             };
    //         }));

    //         return userList;
    //     } catch (error) {
    //         console.error("Error retrieving Telegram user information:", error);
    //         return [];
    //     }
    // }

    async getFemaleUserList(telegramId: string): Promise<GetFemaleUserList[]> {
        try {
            console.log("GetFemaleUserList");
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
                select: ["telegramIdMale"],
                where: {
                    telegramIdFemale: telegramId,
                }
            });

            const hasAccepted = await this.messageListRepository.find({
                select: ["telegramIdMale"],
                where: {
                    telegramIdFemale: telegramId,
                    hasAccepted: true
                }
            });

            const offeredMenIds = hasOffered.map(offer => offer.telegramIdMale);
            const acceptedMenIds = hasAccepted.map(accept => accept.telegramIdMale);
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
                            hasLiked: currentUser.likedUsers?.includes(user.telegramId.toString()) || false,
                            hasOffered: offeredMenIds.includes(user.telegramId),
                            hasAccepted: acceptedMenIds.includes(user.telegramId),
                            place: user.place,
                            numLikes: user.numLikes,
                            salary: user.salary,
                            workingPlace: user.workingPlace,
                            relationshipType: user.relationshipType,
                            bio: user.bio
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

    async likeUser(telegramId: string, likedTelegramId: string): Promise<boolean> {
        // Get the QueryRunner from the repository's manager
        const queryRunner = this.telegramUserRepository.manager.connection.createQueryRunner();
        
        // Start transaction
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {   
            const user = await queryRunner.manager.findOne(TelegramUser, { 
                where: { telegramId } 
            });

            const likedUser = await queryRunner.manager.findOne(TelegramUser, { 
                where: { telegramId: likedTelegramId } 
            });
            
            if (!user || !likedUser) {
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
            likedUser.numLikes += 1;
            await queryRunner.manager.save(user);
            await queryRunner.manager.save(likedUser);
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

    async unlikeUser(telegramId: string, unlikedTelegramId: string): Promise<boolean> {
        if (unlikedTelegramId === undefined || unlikedTelegramId === null) {
            console.error("Invalid unlikedTelegramId");
            return false;
        }

        const queryRunner = this.telegramUserRepository.manager.connection.createQueryRunner();
        
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            const user = await queryRunner.manager.findOne(TelegramUser, { where: { telegramId } });
            const unlikedUser = await queryRunner.manager.findOne(TelegramUser, { where: { telegramId: unlikedTelegramId } });

            if (!user || !unlikedUser) {
                return false;
            }
            
            // Ensure likedUsers is initialized
            user.likedUsers = user.likedUsers || [];
            
            // Remove unlikedTelegramId from likedUsers array
            user.likedUsers = user.likedUsers.filter(id => id !== unlikedTelegramId.toString());
            
            unlikedUser.numLikes -= 1;
            await queryRunner.manager.save(user);
            await queryRunner.manager.save(unlikedUser);
            await queryRunner.commitTransaction();
            return true;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error("Error unliking user:", error);
            return false;
        } finally {
            await queryRunner.release();
        }
    }
}
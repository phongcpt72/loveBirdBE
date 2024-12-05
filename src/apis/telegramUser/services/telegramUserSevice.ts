import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
// import { Product, ProductRepository, User, UserRepository, HistoryRepository } from "../../../dal";
import { CreateTelegramUserDto } from "../dto/CreateTelegramUserDto";
import { TelegramUser, TelegramUserRepository } from "../../../dal";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";
import { GetUserList } from "../dto/GetUserList";

@Injectable()
export class TelegramUserService {


    @Inject(TelegramUserRepository)
    private readonly telegramUserRepository: TelegramUserRepository;

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

    async getTelegramUser(telegramId: number): Promise<{ 
        telegramId: number | null;
        username: string | null; 
        gender: string | null; 
        age: number | null; 
        avatar: string | null 
    } | null> {
        try {
            if (telegramId === undefined) {
                return { telegramId: null, username: null, gender: null, age: null, avatar: null };
            }
            const user = await this.telegramUserRepository.findOne({
                select: ["userName", "gender", "age", "avatar"],
                where: { telegramId }
            });

            if (user) {
                const { userName: username, gender, age, avatar } = user;
                return { telegramId, username, gender, age, avatar };
            }
            // Return an object with null values if the user is not found
            return { telegramId: null, username: null, gender: null, age: null, avatar: null };
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return { telegramId: null, username: null, gender: null, age: null, avatar: null };
        }
    }

    async getUserList(telegramId: number): Promise<GetUserList[]> {
        try {
            const currentUser = await this.telegramUserRepository.findOne({ where: { telegramId } });
            if (!currentUser) {
                console.error("User not found with the given telegramId");
                return [];
            }
            const oppositeGender = currentUser.gender === 'F' ? 'M' : 'F';
            const users = await this.telegramUserRepository.find({
                select: ["telegramId", "userName", "gender", "age", "avatar", "videos"],
                where: { gender: oppositeGender }
            });
            const userList: GetUserList[] = users.map(user => ({
                telegramId: user.telegramId,
                username: user.userName, 
                gender: user.gender,
                age: user.age,
                avatar: user.avatar,
                videos: user.videos
            }));

            console.log(userList);
            return userList;
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return [];
        }
    }

}

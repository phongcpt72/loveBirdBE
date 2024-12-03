import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
// import { Product, ProductRepository, User, UserRepository, HistoryRepository } from "../../../dal";
import { CreateTelegramUserDto } from "../dto/CreateTelegramUserDto";
import { TelegramUser, TelegramUserRepository } from "../../../dal";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";

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
        username: string | null; 
        gender: string | null; 
        age: number | null; 
        avatar: string | null 
    } | null> {
        try {
            const user = await this.telegramUserRepository.findOne({
                select: ["userName", "gender", "age", "avatar"],
                where: { telegramId }
            });

            if (user) {
                const { userName: username, gender, age, avatar } = user;
                return { username, gender, age, avatar };
            }
            // Return an object with null values if the user is not found
            return { username: null, gender: null, age: null, avatar: null };
        } catch (error) {
            console.error("Error retrieving Telegram user information:", error);
            return { username: null, gender: null, age: null, avatar: null };
        }
    }

    async listTelegramUser(telegramId: number): Promise<string> {
        try {
            // Find the user with the given telegramId
            const currentUser = await this.telegramUserRepository.findOne({ where: { telegramId } });

            if (!currentUser) {
                console.error("User not found with the given telegramId");
                return JSON.stringify([]);
            }

            // Determine the opposite gender
            const oppositeGender = currentUser.gender === 'F' ? 'M' : 'F';

            // Fetch users of the opposite gender, selecting only specific columns
            const users = await this.telegramUserRepository.find({
                select: ["userName", "gender", "age"],
                where: { gender: oppositeGender }
            });
            console.log(users);
            // Convert the result to JSON
            return JSON.stringify(users);
        } catch (error) {
            console.error("Error listing Telegram users:", error);
            return JSON.stringify([]);
        }
    }

    async listTelegramUsers(): Promise<string> {
        const users = await this.telegramUserRepository.find();
        return JSON.stringify(users);
    }

}

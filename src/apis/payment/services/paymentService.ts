import { Inject, Injectable } from "@tsed/di";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";
import SHARES_ABI from "../../../services/abis/Shares.json";
import {TelegramUserRepository, MessageListRepository, MessageList } from "../../../dal"
import {GroupChatService} from "../../../apis/messageList/services/groupChatService"
import axios from 'axios';
require('dotenv').config();

const provider = new providers.JsonRpcProvider(process.env.RPC_PROVIDER || '');
const productContract = new Contract(process.env.PRODUCT_ADDRESS || '', SHARES_ABI, provider);
const percent = 1e18;
@Injectable()
export class PaymentService {

    @Inject(TelegramUserRepository)
    private readonly telegramUserRepository: TelegramUserRepository;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    @Inject(GroupChatService)
    private readonly groupChatService: GroupChatService;

    async getPrice(supply: number, amount: number): Promise<number> {
        try {
            const price = await productContract.getPrice(supply, amount);
            const priceNumber = BigNumber.from(price).toNumber();
            console.log(priceNumber);
            return priceNumber;
        } catch (error) {
            console.error('Error getting price:', error);
            throw error;
        }
    }

    async getProtocolFeePercent(): Promise<number> {
        return Number(await productContract.protocolFeePercent());
    }

    async getSubjectFeePercent(): Promise<number> {
        return Number(await productContract.subjectFeePercent());
    }

    async getBuyPriceInformation(sharesSubject: string, sharesAmount: number, amount: number): Promise<number> {
        let buyPrice;
        if(sharesAmount == 0){
            buyPrice = await productContract.getPrice(1, amount);
        }
        else{
            buyPrice = await productContract.getBuyPrice(sharesSubject, amount);
        }

        const protocolFeePercent = await this.getProtocolFeePercent();
        const protocolFeeAmount = Number(buyPrice * protocolFeePercent / percent);
        const subjectFeePercent = await this.getSubjectFeePercent();
        const subjectFeeAmount = Number(buyPrice * subjectFeePercent / percent);
        const finalPrice = Number(buyPrice) + protocolFeeAmount + subjectFeeAmount;
        return finalPrice;
    }


    async buyShareFirst(sharesSubject: string,sharesAmount:number, amount: number): Promise<number> {
        const finalPrice = await this.getBuyPriceInformation(sharesSubject,sharesAmount , amount);
        return finalPrice;
    }

    async getBalance(publicKey: string): Promise<number> {
        const balance = await provider.getBalance(publicKey);
        return Number((Number(balance)/1e18).toFixed(6));
    }

    async implementBuyShare(sharesSubject: string, amount: number, privateKeyBuyer: string): Promise<{txHash: string; status: string }> {
        let totalAmount = 0;
        const ethers = require('ethers');
        const sharesAmount = await productContract.sharesSupply(sharesSubject);
        try {
            if(sharesAmount == 0) {
                totalAmount = await this.buyShareFirst(sharesSubject, sharesAmount, amount);
            }
            else{
                totalAmount = await productContract.getBuyPriceAfterFee(sharesSubject,amount);
            }
            const wallet = new ethers.Wallet(privateKeyBuyer, provider);
            const buyContract = new ethers.Contract(process.env.PRODUCT_ADDRESS, SHARES_ABI, wallet);
            const balance = await provider.getBalance(wallet.address)
            if (Number(balance) >= totalAmount)
            {
                const gasPrice = await provider.getGasPrice();
                const nonce = await provider.getTransactionCount(wallet.address);
                const tx = await buyContract.buyShares(
                    sharesSubject,
                    amount,
                    {
                        from: wallet.address,
                        value: totalAmount,
                        gasPrice: gasPrice,
                        nonce: nonce
                    }
                );
                const txHash = tx.hash;
                const status = await this.checkTransactionStatus(txHash);
                return {txHash,status};
            }
            return {txHash: '',status: 'insufficient_balance'};
        } catch (error) {
            console.error('Error buying share:', error);
            throw error;
        }
    }

    async buyShare(telegramIdBuyer: number, telegramIdFemale: number, amount: number): Promise<boolean> {
        try {
            if (telegramIdBuyer === undefined && telegramIdFemale === undefined) {
                return false;
            }
            const buyer = await this.telegramUserRepository.findOne({
                select: ["privateKey"],
                where: { telegramId: telegramIdBuyer }
            });

            const female = await this.telegramUserRepository.findOne({
                select: ["publicKey"],
                where: { telegramId: telegramIdFemale }
            });


            if(buyer && female){
                const result = await this.implementBuyShare(female.publicKey, amount, buyer.privateKey);
                if(result.status == 'success'){
                    const messageList = new MessageList();
                    messageList.telegramIdMen = telegramIdBuyer;
                    messageList.telegramIdFemale = telegramIdFemale;
                    messageList.txHash = result.txHash;
                    messageList.status = "Pending"
                    messageList.isPending = true;
                    await this.messageListRepository.save(messageList);
                    return true;
                }  
            }
            return false;
            
        } catch (error) {
            console.error('Error buying share:', error);
            return false;
        }
    }

    async checkTransactionStatus(txHash: string): Promise<string> {
        try {
            const receipt = await provider.getTransactionReceipt(txHash);
            if (!receipt) {
                return 'pending';
            }
            return receipt.status === 1 ? 'success' : 'failed';
        } catch (error) {
            console.error('Error checking transaction status:', error);
            throw error;
        }
    }

    async checkUser(telegramId: number): Promise<boolean> {
        try {
            const user = await this.telegramUserRepository.findOne({
                where: { telegramId: telegramId }
            });
            return user !== null;
        } catch (error) {
            console.error('Error checking user:', error);
            return false;
        }
    }

    async acceptOffer(telegramIdMale: number, telegramIdFemale: number): Promise<boolean> {
        try {
            // Improve validation to check for actual numbers
            if (!telegramIdMale || !telegramIdFemale || 
                !Number.isInteger(telegramIdMale) || !Number.isInteger(telegramIdFemale)) {
                console.log('Invalid telegram IDs provided:', { telegramIdMale, telegramIdFemale });
                return false;
            }

            // Check if both users exist
            const [maleExists, femaleExists] = await Promise.all([
                this.checkUser(telegramIdMale),
                this.checkUser(telegramIdFemale)
            ]);

            if (!maleExists || !femaleExists) {
                console.log('One or both users do not exist:', { maleExists, femaleExists });
                return false;
            }

            // Find pending message with better error logging
            const messageList = await this.messageListRepository.findOne({
                where: { 
                    telegramIdMen: telegramIdMale,
                    telegramIdFemale: telegramIdFemale,
                    isPending: true
                }
            });

            if (!messageList) {
                console.log('No pending offer found for users:', { telegramIdMale, telegramIdFemale });
                return false;
            }

            // Update message status
            messageList.status = "Accepted";
            messageList.isPending = false;
            await this.messageListRepository.save(messageList);
            await this.sendMessage(telegramIdMale, telegramIdFemale, messageList.txHash);
            return true;

        } catch (error) {
            console.error('Error accepting offer:', error);
            return false;
        }
    }

    async sendMessage(telegramIdFemale: number, telegramIdMale: number, txHash: string): Promise<boolean> {
        try{
            const [userFemale, userMale] = await Promise.all([
                this.telegramUserRepository.findOne({
                    select: ["userName"],
                    where: { telegramId: telegramIdFemale }
                }),
                this.telegramUserRepository.findOne({
                    select: ["userName"],
                    where: { telegramId: telegramIdMale }
                })
            ]);
            const groupLink = await this.groupChatService.getGroupChatLink(txHash);
            const dateTime = '12pm'
            const location = 'Cross Restaurant'

            const messageForFemale = encodeURIComponent(`You have a Lovebird date with ${userMale?.userName} @ ${dateTime} ${location} ${groupLink}`);
            const messageForMale = encodeURIComponent(`You have a Lovebird date with ${userFemale?.userName} @ ${dateTime} ${location} ${groupLink}`);

            const urlForFemale = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${telegramIdFemale}&text=${messageForFemale}`;
            const urlForMale = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${telegramIdMale}&text=${messageForMale}`;

            try {
                const [femaleResponse, maleResponse] = await Promise.all([
                    axios.get(urlForFemale),
                    axios.get(urlForMale)
                ]);
                
                // Check if the requests were successful
                if (femaleResponse.status === 200 && maleResponse.status === 200) {
                    return true;
                }

                console.error('Failed to send messages:', {
                    femaleStatus: femaleResponse.status,
                    maleStatus: maleResponse.status
                });

                return false;
            } catch (requestError) {
                console.error('Failed to send Telegram messages:', requestError);
                return false;
            }
        }
        catch(error){
            console.error('Error sending message:', error);
            return false;
        }


    }

}
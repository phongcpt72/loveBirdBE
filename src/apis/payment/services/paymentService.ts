import { Inject, Injectable } from "@tsed/di";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";
import SHARES_ABI from "../../../services/abis/Shares.json";
import ERC20_ABI from "../../../services/abis/ERC20.json";
import {TelegramUserRepository, MessageListRepository, MessageList } from "../../../dal"
import {GroupChatService} from "../../../apis/messageList/services/groupChatService"
import {DatingInformationService} from "../../../apis/datingLocation/services/DatingInformationService"
import axios from 'axios';
require('dotenv').config();

const provider = new providers.JsonRpcProvider(process.env.RPC_PROVIDER || '');

@Injectable()
export class PaymentService {

    @Inject(TelegramUserRepository)
    private readonly telegramUserRepository: TelegramUserRepository;

    @Inject(MessageListRepository)
    private readonly messageListRepository: MessageListRepository;

    @Inject(GroupChatService)
    private readonly groupChatService: GroupChatService;

    @Inject(DatingInformationService)
    private readonly datingInformationService: DatingInformationService;

    async getTokenBalance(privateKey: string): Promise<number> {
        const wallet = await new ethers.Wallet(privateKey, provider);
        const token = await new Contract(process.env.TOKEN_ADDRESS || '', ERC20_ABI, wallet);
        const balance = await token.balanceOf(wallet.address);
        return Number((Number(balance)/1e6));
    }

    async getBalanceInEther(publicKey: string): Promise<number> {
        const balance = await provider.getBalance(publicKey);
        return Number((Number(balance)/1e18).toFixed(6));
    }

    async implementBuyShare(sharesSubject: string, amount: number, privateKeyBuyer: string, tokenAddress: string): Promise<{txHash: string; status: string }> {
        const ethers = require('ethers');
        const wallet = new ethers.Wallet(privateKeyBuyer, provider);
        const token = new Contract(tokenAddress, ERC20_ABI, wallet);
        const balance = await token.balanceOf(wallet.address);
        try {
            const sharesContract = new ethers.Contract(process.env.PRODUCT_ADDRESS, SHARES_ABI, wallet);
            const sharePrice = await sharesContract.getPrice(tokenAddress)
            if (Number(balance) >= Number(sharePrice))
            {
                const gasPrice = await provider.getGasPrice();
                const nonce = await provider.getTransactionCount(wallet.address, 'latest');
                const gasLimit = ethers.utils.hexlify(1000000);

                const approveTx = await token.approve(sharesContract.address, sharePrice,
                    {
                        from: wallet.address,
                        gasPrice: gasPrice,
                        // gasLimit: gasLimit,
                        nonce: nonce
                    }
                );

                // Wait for 1 second after approve
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if(await this.checkTransactionStatus(approveTx.hash) == 'success'){
                    const updatedNonce = await provider.getTransactionCount(wallet.address, 'latest');
                    const tx = await sharesContract.buyShares(
                        sharesSubject,
                        amount,
                        tokenAddress,
                        {
                            from: wallet.address,
                            gasPrice: gasPrice,
                            // gasLimit: gasLimit,
                            nonce: updatedNonce
                        }
                    );
                    const txHash = tx.hash;
                    const status = await this.checkTransactionStatus(txHash);
                    return {txHash,status};
            }
            }
            return {txHash: '',status: 'insufficient_balance'};
        } catch (error) {
            console.error('Error buying share:', error);
            throw error;
        }
    }

    async buyShare(telegramIdBuyer: number, telegramIdFemale: number, tokenAddress: string): Promise<boolean> {
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
                const result = await this.implementBuyShare(female.publicKey, 1, buyer.privateKey, tokenAddress);
                if(result.status == 'success'){
                    const messageList = new MessageList();
                    messageList.telegramIdMen = telegramIdBuyer;
                    messageList.telegramIdFemale = telegramIdFemale;
                    messageList.txHash = result.txHash;
                    messageList.status = "Pending"
                    messageList.isPending = true;
                    messageList.hasAccepted = false;
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
            messageList.hasAccepted = true;
            await this.messageListRepository.save(messageList);
            
            await this.sendMessage(telegramIdMale, telegramIdFemale, messageList.txHash);
            return true;

        } catch (error) {
            console.error('Error accepting offer:', error);
            return false;
        }
    }

    async sendMessage(telegramIdMale: number, telegramIdFemale: number, txHash: string): Promise<boolean> {
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
            if (groupLink) {
                try{
                    await this.groupChatService.changeGroupName(
                        userMale?.userName ?? 'User1', 
                        userFemale?.userName ?? 'User2', 
                        groupLink
                    );
                    console.log("groupLink");
                    console.log(groupLink);
                }
                catch(error){
                    console.error('Error changing group name:', error);
                    return false;
                }
            }

            const dateAndLocation = await this.datingInformationService.getDateAndLocation(telegramIdMale, telegramIdFemale);
            if (!dateAndLocation) return false;

            const {title, formattedDate, formattedTime} = dateAndLocation;

            const messageForFemale = encodeURIComponent(`You have a Lovebird date with ${userMale?.userName} @ ${formattedTime} (${formattedDate}) ${title} ${groupLink}`);
            const messageForMale = encodeURIComponent(`You have a Lovebird date with ${userFemale?.userName} @ ${formattedTime} (${formattedDate}) ${title} ${groupLink}`);

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
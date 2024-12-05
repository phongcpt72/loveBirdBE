import { Inject, Injectable } from "@tsed/di";
import { BigNumber, ethers, FixedNumber, Contract , Wallet, providers, utils} from "ethers";
import SHARES_ABI from "../../../services/abis/Shares.json";
import {TelegramUserRepository} from "../../../dal"
require('dotenv').config();

const provider = new providers.JsonRpcProvider(process.env.RPC_PROVIDER || '');
const productContract = new Contract(process.env.PRODUCT_ADDRESS || '', SHARES_ABI, provider);
const percent = 1e18;
@Injectable()
export class PaymentService {

    @Inject(TelegramUserRepository)
    private readonly telegramUserRepository: TelegramUserRepository;


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

    async implementBuyShare(sharesSubject: string, amount: number, privateKeyBuyer: string) {
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
                console.log(txHash);
            }

        } catch (error) {
            console.error('Error buying share:', error);
            throw error;
        }
        return totalAmount;
    }

    async buyShare(telegramIdBuyer: number, telegramIdFemale: number, amount: number): Promise<boolean> {
        try {
            if (telegramIdBuyer === undefined || telegramIdFemale === undefined) {
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
                await this.implementBuyShare(female.publicKey, amount, buyer.privateKey);
            }
            return true;
        } catch (error) {
            console.error('Error buying share:', error);
            return false;
        }
    }



}
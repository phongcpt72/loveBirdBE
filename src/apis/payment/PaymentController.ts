import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { PaymentService } from "./services/paymentService";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { Get, Post, Returns, Summary, Description } from "@tsed/schema";
@Controller("/payment")
export class PaymentController {
    @Inject()
    private readonly paymentService: PaymentService;



    @Post("/buy-share")
    @Summary("Buy share")
    @Returns(201, String)
    @Returns(400, String)
    async buyShare(
        @BodyParams("telegramIdBuyer") telegramIdBuyer: string,
        @BodyParams("telegramIdFemale") telegramIdFemale: string,
        @BodyParams("tokenAddress") tokenAddress: string,
        @Res() res: Res
    ): Promise<void> {
        try {
            const result = await this.paymentService.buyShare(telegramIdBuyer, telegramIdFemale, tokenAddress);
            console.log(result);
            if (result) {
                res.status(201).send({ message: 'Transaction successful' });
            } else {
                res.status(400).send({ message: 'Transaction failed' });
            }
        } 
        catch (error) {
        res.status(500).send({ message: 'Internal server error', error: error.message });
        }
    }

    @Get("/check-transaction-status/:txHash")
    @Summary("Check transaction status")
    @Returns(200, String)
    async checkTransactionStatus(
        @PathParams("txHash") txHash: string
    ): Promise<string> {
        return await this.paymentService.checkTransactionStatus(txHash);
    }

    @Post("/accept-offer")
    @Summary("Accept offer")
    @Returns(201, String)
    @Returns(400, String)
    async acceptOffer(
        @BodyParams("telegramIdMale") telegramIdMale: string,
        @BodyParams("telegramIdFemale") telegramIdFemale: string,
        @Res() res: Res
    ): Promise<void> {
        try {
            const result = await this.paymentService.acceptOffer(telegramIdMale, telegramIdFemale);
            if (result) {
                res.status(201).send({ message: 'Offer accepted' });
            } else {
                res.status(400).send({ message: 'Offer not accepted' });
            }
        }
        catch (error) {
            res.status(500).send({ message: 'Internal server error', error: error.message });
        }
    }


    @Post("/send-message-after-accept-offer")
    @Summary("Send message after accept offer")
    @Returns(200, Boolean)
    async sendMessageAfterAcceptOffer(
        @BodyParams("telegramIdMale") telegramIdMale: string,
        @BodyParams("telegramIdFemale") telegramIdFemale: string,
        @BodyParams("txHash") txHash: string    
    ): Promise<boolean> {
        return await this.paymentService.messageAcceptOffer(telegramIdMale, telegramIdFemale, txHash);
    }
}

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
        @BodyParams("telegramIdBuyer") telegramIdBuyer: number,
        @BodyParams("telegramIdFemale") telegramIdFemale: number,
        @BodyParams("amount") amount: number,
        @Res() res: Res
    ): Promise<void> {
        try {
            const result = await this.paymentService.buyShare(telegramIdBuyer, telegramIdFemale, amount);
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

}
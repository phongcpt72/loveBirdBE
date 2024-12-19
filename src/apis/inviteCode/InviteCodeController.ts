import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { Get, Post, Returns, Summary, Description } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { InviteCodeService } from "./services/inviteCodeService";

@Controller("/inviteCode")
export class InviteCodeController {

    @Inject()
    private readonly inviteCodeService: InviteCodeService;


    @Get("/check-user")
    @Summary("Check user invite code")
    @Returns(200, Boolean)
    async checkUser(@QueryParams("telegramId") telegramId: string): Promise<boolean> {
        return await this.inviteCodeService.checkUser(telegramId);
    }

    @Get("/check-invite-code")
    @Summary("Check invite code")
    @Returns(200, Boolean)
    async checkInviteCode(@QueryParams("code") code: string): Promise<string> {
        return await this.inviteCodeService.checkInviteCode(code);
    }
    @Post("/create-invite-code")
    @Summary("Create invite code")
    @Returns(200, Boolean)
    async createInviteCode(@BodyParams("code") code: string[], @Res() res: Res): Promise<boolean> {
        const result = await this.inviteCodeService.createInviteCode(code);
        if (result) {
            res.status(200).send({ message: 'Invite code created successfully' });
        } else {
            res.status(400).send({ message: 'Invite code creation failed' });
        }
        return result;
    }

    

    @Post("/update-invite-code")
    @Summary("Update invite code")
    @Returns(200, Boolean)
    async updateInviteCode(@BodyParams("telegramId") telegramId: string, @BodyParams("code") code: string, @Res() res: Res): Promise<boolean> {
        const result = await this.inviteCodeService.updateInviteCode(telegramId, code);
        if (result) {
            res.status(200).send({ message: 'Invite code updated successfully' });
        } else {
            res.status(400).send({ message: 'Invite code update failed' });
        }
        return result;
    }

    

}

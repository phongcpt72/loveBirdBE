import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { Get, Post, Returns, Summary, Description } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { CreateTelegramUserDto } from "./dto/CreateTelegramUserDto";
import { TelegramUserService } from "./services/telegramUserSevice";
import { GetFemaleUserList } from "./dto/GetFemaleUserList";
import { GetMaleUserList } from "./dto/GetMaleUserList";
import { ActiveUserDto } from "./dto/ActiveUserDto";
@Controller("/telegramusers")
export class TelegramUserController {

    @Inject()
    private readonly telegramUserService: TelegramUserService;

    @Post("/create-telegram-user")
    @Summary('Create a new Telegram user')
    @Returns(201, String)
    @Returns(400, String)
    async createTelegramUser(
    @BodyParams() body: CreateTelegramUserDto,
    @Res() res: Res
  ): Promise<void> {
    try {
      const result = await this.telegramUserService.createTelegramUser(body);
      console.log(result);
      if (result) {
        res.status(201).send({ message: 'User created successfully' });
      } else {
        res.status(400).send({ message: 'User creation failed' });
      }
    } catch (error) {
      res.status(500).send({ message: 'Internal server error', error: error.message });
    }
  }

    @Get("/get-telegram-user")
    async getTelegramUser(@QueryParams("telegramId") telegramId: string): Promise<{ telegramId: string | null; username: string | null; gender: string | null; age: number | null; avatar: string | null; publicKey: string | null; balance: string | null } | null> {
        return await this.telegramUserService.getTelegramUser(telegramId);  
    }


    @Get("/get-male-user-list")
    @Summary("Get a list of users of the opposite gender")
    @Returns(200, GetMaleUserList)
    async getMaleUserList(@QueryParams("telegramId") telegramId: string): Promise<GetMaleUserList[]> {
        return await this.telegramUserService.getMaleUserList(telegramId);
    }

    @Get("/get-female-user-list")
    @Summary("Get a list of users of the opposite gender")
    @Returns(200, GetFemaleUserList)
    async getFemaleUserList(@QueryParams("telegramId") telegramId: string): Promise<GetFemaleUserList[]> {
        return await this.telegramUserService.getFemaleUserList(telegramId);
    }

    @Post("/like-user")
    @Summary("Like a user")
    @Returns(200, Boolean)
    async likeUser(
        @BodyParams("telegramId") telegramId: string,
        @BodyParams("likedTelegramId") likedTelegramId: string,
        @Res() res: Res
    ): Promise<void> {
      const result= await this.telegramUserService.likeUser(telegramId, likedTelegramId);
      if (result) {
        res.status(200).send({ message: 'User liked successfully' });
      } else {
        res.status(400).send({ message: 'User liked before' });
      }
    }

    @Post("/unlike-user")
    @Summary("Unlike a user")
    @Returns(200, Boolean)
    async unlikeUser(
        @BodyParams("telegramId") telegramId: string,
        @BodyParams("unlikedTelegramId") unlikedTelegramId: string,
        @Res() res: Res
    ): Promise<void> {
        const result = await this.telegramUserService.unlikeUser(telegramId, unlikedTelegramId);
        if (result) {
            res.status(200).send({ message: 'User unliked successfully' });
        } else {
            res.status(400).send({ message: 'User unliked before' });
        }
    }

    @Post("/update-active-user")
    @Summary("Update active user")
    @Returns(200, Boolean)
    async updateActiveUser(
        @BodyParams("telegramId") telegramId: string,
        @BodyParams("activeTime") activeTime: string,
        @Res() res: Res
    ): Promise<void> {
        const result = await this.telegramUserService.updateActiveUser(telegramId, activeTime);
        if (result) {
            res.status(200).send({ message: 'Active user time updated successfully' });
        } else {
            res.status(400).send({ message: 'Active user time update failed' });
        }
    }

    @Post("/mute-user")
    @Summary("Mute a user")
    @Returns(200, Boolean)
    async muteUser(
        @BodyParams("telegramId") telegramId: string,
        @Res() res: Res
    ): Promise<void> {
        const result = await this.telegramUserService.muteUser(telegramId);
        if (result) {
            res.status(200).send({ message: 'User muted successfully' });
        } else {
            res.status(400).send({ message: 'User muted failed' });
        }
    }

    @Post("/send-like-message")
    @Summary("Send like message")
    @Returns(200, Boolean)
    async sendLikeMessage(
        @BodyParams("telegramIdMale") telegramIdMale: string,
        @BodyParams("telegramIdFemale") telegramIdFemale: string,
        @Res() res: Res
    ): Promise<void> {
        const result = await this.telegramUserService.sendLikeMessage(telegramIdMale, telegramIdFemale);
        if (result) {
            res.status(200).send({ message: 'Like message sent successfully' });
        } else {
            res.status(400).send({ message: 'Like message send failed' });
        }
    }
}

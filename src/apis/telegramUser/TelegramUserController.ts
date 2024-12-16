import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { Get, Post, Returns, Summary, Description } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { CreateTelegramUserDto } from "./dto/CreateTelegramUserDto";
import { TelegramUserService } from "./services/telegramUserSevice";
import { GetFemaleUserList } from "./dto/GetFemaleUserList";
import { GetMaleUserList } from "./dto/GetMaleUserList";

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
      const { telegramId, gender, username, age } = body;
      const result = await this.telegramUserService.createTelegramUser(telegramId, gender, username, age);
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
    async getTelegramUser(@QueryParams("telegramId") telegramId: number): Promise<{ telegramId: number | null; username: string | null; gender: string | null; age: number | null; avatar: string | null; publicKey: string | null; balance: string | null } | null> {
        return await this.telegramUserService.getTelegramUser(telegramId);  
    }


    @Get("/get-male-user-list")
    @Summary("Get a list of users of the opposite gender")
    @Returns(200, GetMaleUserList)
    async getMaleUserList(@QueryParams("telegramId") telegramId: number): Promise<GetMaleUserList[]> {
        return await this.telegramUserService.getMaleUserList(telegramId);
    }

    @Get("/get-female-user-list")
    @Summary("Get a list of users of the opposite gender")
    @Returns(200, GetFemaleUserList)
    async getFemaleUserList(@QueryParams("telegramId") telegramId: number): Promise<GetFemaleUserList[]> {
        return await this.telegramUserService.getFemaleUserList(telegramId);
    }

    @Post("/like-user")
    @Summary("Like a user")
    @Returns(200, Boolean)
    async likeUser(
        @BodyParams("telegramId") telegramId: number,
        @BodyParams("likedTelegramId") likedTelegramId: number,
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
        @BodyParams("telegramId") telegramId: number,
        @BodyParams("unlikedTelegramId") unlikedTelegramId: number,
        @Res() res: Res
    ): Promise<void> {
        const result = await this.telegramUserService.unlikeUser(telegramId, unlikedTelegramId);
        if (result) {
            res.status(200).send({ message: 'User unliked successfully' });
        } else {
            res.status(400).send({ message: 'User unliked before' });
        }
    }

}

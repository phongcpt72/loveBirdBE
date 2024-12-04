import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { Get, Post, Returns, Summary, Description } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { CreateTelegramUserDto } from "./dto/CreateTelegramUserDto";
import { TelegramUserService } from "./services/telegramUserSevice";

@Controller("/telegramusers")
export class TelegramUserController {

    @Inject()
    private readonly telegramUserService: TelegramUserService;

    @Post("/create-telegram-user")
    @Summary('Create a new Telegram user')
    @Returns(201, String).Description("User created successfully")
    @Returns(400, String).Description("Invalid request body")
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
    async getTelegramUser(@QueryParams("telegramId") telegramId: number): Promise<{ telegramId: number | null; username: string | null; gender: string | null; age: number | null; avatar: string | null } | null> {
        return await this.telegramUserService.getTelegramUser(telegramId);  
    }

    @Get("/list-telegram-user")
    async listTelegramUser(@QueryParams("telegramId") telegramId: number): Promise<string> {
        return this.telegramUserService.listTelegramUser(telegramId);
    }

}

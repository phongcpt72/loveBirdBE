import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { Get, Post, Returns,Summary } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { CreateTelegramUserDto } from "./dto/CreateTelegramUserDto";
import { TelegramUserService } from "./services/telegramUserSevice";

@Controller("/telegramusers")
export class TelegramUserController {

    @Inject()
    private readonly telegramUserService: TelegramUserService;

    @Post("/create-telegram-user")
    async createTelegramUser(
        @QueryParams("telegramId")   telegramId: number,
        @QueryParams("gender") gender: string,
        @QueryParams("username") username: string,
        @QueryParams("age") age: number
    ): Promise<boolean> {
        return this.telegramUserService.createTelegramUser(telegramId,gender,username,age);
    }

    @Get("/get-telegram-user")
    async getTelegramUser(@QueryParams("telegramId") telegramId: number): Promise<{ username: string | null; gender: string | null; age: number | null; avatar: string | null } | null> {
        return await this.telegramUserService.getTelegramUser(telegramId);  
    }

    @Get("/list-telegram-user")
    async listTelegramUser(@QueryParams("telegramId") telegramId: number): Promise<string> {
        return this.telegramUserService.listTelegramUser(telegramId);
    }

    @Get("/list-telegram-users-Kenji")
    async listTelegramUsers(): Promise<string> {
        return this.telegramUserService.listTelegramUsers();
    }


}

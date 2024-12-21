import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { Get, Post, Returns, Summary, Description } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { MessageListService } from "./services/messageListService";
import { GetMessagesList } from "./dto/GetMessagesList";
import { GroupChatService } from "./services/groupChatService";
@Controller("/messageList")
export class MessageListController {

    @Inject(MessageListService)
    private readonly messageListService: MessageListService;

    @Inject(GroupChatService)
    private readonly groupChatService: GroupChatService;

    @Get("/get-messages-list")
    async getMessagesList(@QueryParams("telegramId") telegramId: string): Promise<GetMessagesList[]> {
        return await this.messageListService.getMessagesList(telegramId);
    }

    @Post("/create-group-chat-link")
    @Summary("Create group chat links")
    @Description("Creates group chat links from an array of link strings")
    @Returns(200, Boolean)
    async createGroupChatLink(
        @BodyParams("linkArray") linkArray: string[]
    ): Promise<boolean> {
        if (!Array.isArray(linkArray) || linkArray.length === 0) {
            throw new Error("Invalid input: linkArray must be a non-empty array of strings");
        }
        return await this.groupChatService.createGroupChatLink(linkArray);
    }

    @Get("/get-message-list-male")
    @Summary("Get message list male")
    async getMessageListMale(@QueryParams("telegramId") telegramId: string): Promise<GetMessagesList[]> {
        return await this.messageListService.getMessageListMale(telegramId);
    }

    @Get("/get-message-list-female")
    @Summary("Get message list female")
    async getMessageListFemale(@QueryParams("telegramId") telegramId: string): Promise<GetMessagesList[]> {
        return await this.messageListService.getMessageListFemale(telegramId);
    }

}
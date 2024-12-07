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
    async getMessagesList(@QueryParams("telegramId") telegramId: number): Promise<GetMessagesList[]> {
        return await this.messageListService.getMessagesList(telegramId);
    }

    @Post("/create-group-chat-link")
    async createGroupChatLink(@BodyParams("links") links: string[]): Promise<boolean> {
        return await this.groupChatService.createGroupChatLink(links);
    }

}
import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { GroupChatLinkRepository } from "../../../dal";
import { GroupChatLink } from "../../../dal/entity/GroupChatLink";
// import { Telegraf, Context } from 'telegraf';

// const bot = new Telegraf<Context>(process.env.TELEGRAM_BOT_TOKEN || "");

@Injectable()
export class GroupChatService {

    @Inject(GroupChatLinkRepository)
    private readonly groupChatLinkRepository: GroupChatLinkRepository;


    // async createGroupChatLink(links: string[]): Promise<boolean> { 
    //     // Fetch existing links from the database
    //     const existingLinks = await this.groupChatLinkRepository.find({
    //         select: ["link"],
    //         where: { link: In(links) }
    //     });

    //     // Extract the existing link values
    //     const existingLinkValues = existingLinks.map(entity => entity.link);

    //     // Filter out duplicates from the input links
    //     const newLinks = links.filter(link => !existingLinkValues.includes(link));

    //     // Map the new links to entities
    //     const entities = newLinks.map(link => {
    //         const entity = new GroupChatLink();
    //         entity.link = link;
    //         entity.isUsed = false;
    //         return entity;
    //     });

    //     // Save the new entities
    //     await this.groupChatLinkRepository.save(entities);

    //     const link = await this.getGroupChatLink("Paul");
        
    //     return true;
    // }

    // async getGroupChatLink(txHash: string): Promise<string | null> {
    //     const result = await this.groupChatLinkRepository.findOne({
    //         select: ["link"],
    //         where: { isUsed: false },
    //     });
    //     if (result) {
    //         result.isUsed = true;
    //         result.txHash = txHash;
    //         await this.groupChatLinkRepository.save(result); // Update the link status to used, no new data is created
    //     }
    //     return result?.link || null;
    // }

    // async createGroupInviteLink(groupName: string): Promise<string | null> {
    //     try {
    //         const inviteLink = await bot.telegram.createChatInviteLink(groupName,{
    //             name: 'Public Group Invite',
    //             member_limit: 5,
    //             creates_join_request: false
    //         })
    //         await bot.telegram.setChatTitle(groupName, "PaulLoveBird")
    //         return inviteLink.invite_link;
    //     } catch (error) {
    //         console.error('Error creating group invite link:', error);
    //         return null;
    //     }
    // }


}


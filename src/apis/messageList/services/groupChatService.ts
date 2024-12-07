import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull} from "typeorm";
import { GroupChatLinkRepository } from "../../../dal";
import { GroupChatLink } from "../../../dal/entity/GroupChatLink";

@Injectable()
export class GroupChatService {

    @Inject(GroupChatLinkRepository)
    private readonly groupChatLinkRepository: GroupChatLinkRepository;


    async createGroupChatLink(links: string[]): Promise<boolean> {
        const entities = links.map(link => {
            const entity = new GroupChatLink();
            entity.link = link;
            entity.isUsed = false;
            return entity;
        });
        
        await this.groupChatLinkRepository.save(entities);
        return true;
    }


}


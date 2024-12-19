import { Inject, Injectable } from "@tsed/di";
import { In ,Not , IsNull, ArrayContains} from "typeorm";
import { InviteCodeRepository, InviteCode } from "../../../dal";
@Injectable()
export class InviteCodeService {

   @Inject(InviteCodeRepository)
   private readonly inviteCodeRepository: InviteCodeRepository;

   async createInviteCode(code: string[]): Promise<boolean> {
      const inviteCodes = code.map(code => ({
        code: code,
        isUsed: false,
      }));
      await this.inviteCodeRepository.save(inviteCodes);
      return true;
   }

   async checkUser(telegramId: string): Promise<boolean> {
      const inviteCode = await this.inviteCodeRepository.findOne({ where: { telegramId: telegramId } });
      return inviteCode ? true : false;
   }

   async checkInviteCode(code: string): Promise<string> {
      const inviteCode = await this.inviteCodeRepository.findOne({ where: { code: code } });
      if (!inviteCode) {
          console.error('Invite code not found');
          return 'Invite code not found';
      }
      else if (inviteCode.isUsed) {
          console.error('Invite code already used');
          return 'Invite code already used';
      }
      return 'Invite code is valid';
   }

   async updateInviteCode(telegramId: string, code: string): Promise<boolean> {
      const inviteCode = await this.inviteCodeRepository.findOne({ where: { code: code } });
      if (!inviteCode) {
          console.error('Invite code not found');
          return false;
      }
      inviteCode.usedTime = Date.now().toString();
      inviteCode.isUsed = true;
      inviteCode.telegramId = telegramId;
      await this.inviteCodeRepository.save(inviteCode);
      return true;
   }

}
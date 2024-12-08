import { registerProvider } from "@tsed/di";
import { $log } from "@tsed/common";
// import { Logger } from "@tsed/logger";
import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./Server";
import {
  LoveBirdDataSource,
  TelegramUserRepository,
  TelegramUser,
  MessageListRepository,
  MessageList,
  GroupChatLinkRepository,
  GroupChatLink,
  DatingInformationRepository,
  DatingInformation
} from "./dal";

registerProvider({
  provide: LoveBirdDataSource,
  type: "typeorm:datasource",
  // deps: [Logger],
  async useAsyncFactory() {
    await LoveBirdDataSource.initialize();
    // logger.info("Connected with typeorm to database: PostgreSQL");
    return LoveBirdDataSource;
  },
  hooks: {
    $onDestroy(dataSource) {
      return dataSource.isInitialized && dataSource.destroy();
    },
  },
});


registerProvider({
  provide: TelegramUserRepository,
  useValue: new TelegramUserRepository(TelegramUser, LoveBirdDataSource.createEntityManager()),
});

registerProvider({
  provide: MessageListRepository,
  useValue: new MessageListRepository(MessageList, LoveBirdDataSource.createEntityManager()),
});

registerProvider({
  provide: GroupChatLinkRepository,
  useValue: new GroupChatLinkRepository(GroupChatLink, LoveBirdDataSource.createEntityManager()),
});

registerProvider({
  provide: DatingInformationRepository,
  useValue: new DatingInformationRepository(DatingInformation, LoveBirdDataSource.createEntityManager()),
});

async function bootstrap() {
  try {
    const platform = await PlatformExpress.bootstrap(Server);
    await platform.listen();

    process.on("SIGINT", () => {
      platform.stop();
    });
  } catch (error) {
    $log.error({ event: "SERVER_BOOTSTRAP_ERROR", message: error.message, stack: error.stack });
  }
}

bootstrap();

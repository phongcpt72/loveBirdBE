import { join } from "path";
import { Configuration, Inject } from "@tsed/di";
import { PlatformApplication } from "@tsed/common";
import "@tsed/platform-express"; // Keep this import
import "@tsed/ajv";
import "@tsed/swagger";
import "@tsed/typegraphql";
import "./datasources/index";
import "./resolvers/index";
import { config } from "./config";
import * as pages from "./pages";
import * as apis from "./apis";
import * as fs from 'fs';
import * as path from "path";
import express from "express";
import TelegramBot, { CallbackQuery, InlineQuery, Message } from "node-telegram-bot-api";

// Import the Webhook Controller
import { WebhookController } from "./apis/event/WebhookController";

@Configuration({
  ...config,
  acceptMimes: ["application/json", "image/png", "text/csv"],
  httpPort: process.env.PORT || 3000,
  // httpPort: "0.0.0.0:3000",
  httpsPort: false, // CHANGE
  
  // httpsPort: 3000, // 
  // httpPort: false,   // 
  // httpsOptions: {
  //   key: fs.readFileSync(path.resolve(__dirname, '../ssl/private.key')),
  //   cert: fs.readFileSync(path.resolve(__dirname, '../ssl/certificate.crt'))
  // },

  componentsScan: false,
  mount: {
    "/": [...Object.values(pages)],
    "/api": [...Object.values(apis)],
    "/webhook": [WebhookController], // Mount the webhook controller here
  },
  swagger: [
    {
      path: "/doc",
      specVersion: "3.0.1",
    },
  ],
  middlewares: [
    "cors",
    "cookie-parser",
    "compression",
    "method-override",
    "json-parser",
    { use: "urlencoded-parser", options: { extended: true } },
  ],
  views: {
    root: join(process.cwd(), "../views"),
    extensions: {
      ejs: "ejs",
    },
  },
  exclude: ["**/*.spec.ts"],
})
export class Server {
  @Inject()
  protected app: PlatformApplication;

  @Configuration()
  protected settings: Configuration;

  // Optional: You can define a method to configure additional settings or routes if needed
  $onInit() {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
    const miniAppUrl = process.env.MINI_APP_URL || "";
    const miniAppName = "lovebird_demo";
    const queries: Record<string, CallbackQuery> = {};

    const server = express();

    const telegramAPI = require("node-telegram-bot-api");
    const bot = new telegramAPI(TOKEN, { polling: true, request: {
        agentOptions: {
            keepAlive: true,
            family: 4
        }
    }});


    const port = process.env.PORT || 3002;

    server.use(express.static(path.join(__dirname, 'static')));

    bot.onText(/help/, (msg: Message) => {
      bot.sendMessage(msg.from?.id || 0, "Say /game if you want to play.");
    });

    bot.onText(/start|game/, (msg: Message) => {
      console.log("[msg]: ", msg);
      console.log("[miniAppName]: ", miniAppName);

      const userId = msg.from?.id || 0;
      console.log(`User ID: ${userId}`);

      bot.sendMessage(userId, "Welcome to Lovebird!", {
        reply_markup: {
          inline_keyboard: [[{ text: "Start Lovebird", web_app: { url: `${miniAppUrl}?userId=${userId}` } }]]
        },
      }).catch((err: Error) => console.error("[ERR]: ", err))
    });

    bot.on("callback_query", (query: CallbackQuery) => {
      const userId = query.from.id;
      console.log(`User ID after clicking 'Start Lovebird': ${userId}`);

      if (query.game_short_name !== miniAppName) {
        bot.answerCallbackQuery(query.id, { text: "Sorry, '" + query.game_short_name + "' is not available." });
      } else {
        queries[query.id] = query;
        bot.answerCallbackQuery({ callback_query_id: query.id, url: miniAppUrl });

        bot.sendMessage(userId, `Your user ID is: ${userId}`);
      }
    });

    bot.on("inline_query", (iq: InlineQuery) => {
      bot.answerInlineQuery(iq.id, [{ type: "game", id: "0", game_short_name: miniAppName }]);
    });

    bot.on('polling_error', (error: Error) => {
      console.error('[polling_error]', error);
    });

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}

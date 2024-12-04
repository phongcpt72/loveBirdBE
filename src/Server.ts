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


@Configuration({
  ...config,
  acceptMimes: ["application/json", "image/png", "text/csv"],
  // httpPort: process.env.PORT || 3000,
  // // httpPort: "0.0.0.0:3000",
  // httpsPort: false, // CHANGE
  
  httpsPort: 443, // 
  httpPort: false,   // 
  httpsOptions: {
    key: fs.readFileSync(path.resolve(__dirname, '../ssl/private.key')),
    cert: fs.readFileSync(path.resolve(__dirname, '../ssl/certificate.crt'))
  },

  componentsScan: false,
  mount: {
    "/": [...Object.values(pages)],
    "/api": [...Object.values(apis)],
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
}
}
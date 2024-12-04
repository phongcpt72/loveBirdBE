import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Property, Required } from "@tsed/schema";


@Entity("telegram_users")
export class TelegramUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Property()
  @Required()
  userName: string;

  @Column({ nullable: true })
  @Property()
  telegramId: number;

  @Column({ nullable: true })
  @Property()
  gender: string;

  @Column({ nullable: true })
  @Property()
  age: number;

  @Column({ nullable: true })
  @Property()
  publicKey: string;

  @Column({ nullable: true })
  @Property()
  privateKey: string;

  @Column({ type: "json", nullable: true })
  @Property()
  images: string[];

  @Column({ type: "json", default: [] })
  @Property()
  videos: string[];

  @Column({ nullable: true })
  @Property()
  avatar: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}

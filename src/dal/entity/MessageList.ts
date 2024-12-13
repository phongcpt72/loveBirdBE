import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Property, Required } from "@tsed/schema";


@Entity("message_list")
export class MessageList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Property()
  telegramIdMale: number;

  @Column({ nullable: true })
  @Property()
  telegramIdFemale: number;

  @Column({ nullable: true })
  @Property()
  txHash: string;

  @Column({ nullable: true })
  @Property()
  status: string;

  @Column({ nullable: true })
  @Property()
  isPending: boolean;

  @Column({ nullable: true })
  @Property()
  hasAccepted: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}

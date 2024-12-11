import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Property, Required } from "@tsed/schema";


@Entity("group_chat_link")
export class GroupChatLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Property()
  txHash: string;

  @Column({ nullable: true })
  @Property()
  link: string;

  @Column({ nullable: false })
  @Property()
  isUsed: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}

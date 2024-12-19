import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Property, Required } from "@tsed/schema";


@Entity("active_user")
export class ActiveUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Property()
  telegramId: string;

  @Column({ nullable: true, type: 'bigint' })
  @Property()
  followers: number;

  @Column({ nullable: true, type: 'bigint' })
  @Property()
  holders: number;
  
  @Column({ nullable: true })
  @Property()
  activeTime: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Property, Required } from "@tsed/schema";


@Entity("dating_information")
export class DatingInformation {
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
  title: string;

  @Column({ nullable: true })
  @Property()
  address: string;

  @Column({ nullable: true })
  @Property()
  lat: string;

  @Column({ nullable: true })
  @Property()
  long: string;

  @Column({ nullable: true, type: 'bigint' })
  @Property()
  datingTime: number;
  
  @Column({ nullable: true })
  @Property()
  hasDated: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  public updated_at: Date;
}

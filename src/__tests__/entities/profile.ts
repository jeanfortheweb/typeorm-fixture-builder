import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { User } from "./user";

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column("text")
  bio: string;

  @OneToOne(
    () => User,
    user => user.profile
  )
  user: User;
}

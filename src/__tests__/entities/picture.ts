import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Profile } from "./profile";

@Entity()
export class Picture {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  file: string;

  @ManyToOne(
    () => Profile,
    profile => profile.pictures
  )
  profile: Profile;
}

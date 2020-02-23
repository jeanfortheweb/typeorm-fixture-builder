import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany
} from 'typeorm';
import { User } from './user';
import { Picture } from './picture';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column('text')
  bio: string;

  @OneToOne(
    () => User,
    user => user.profile
  )
  user: User;

  @OneToMany(
    () => Picture,
    picture => picture.profile
  )
  pictures: Picture[];
}

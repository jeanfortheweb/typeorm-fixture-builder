import {
  Entity,
  ManyToMany,
  JoinTable,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user';

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  name: string;

  @ManyToMany(() => User, user => user.groups)
  @JoinTable()
  users: User[];
}

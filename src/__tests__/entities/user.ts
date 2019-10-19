import { Entity, ManyToMany, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Group } from './group';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @ManyToMany(() => Group, group => group.users)
  groups: Group[];
}

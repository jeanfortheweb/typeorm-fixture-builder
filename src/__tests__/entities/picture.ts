import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Profile } from './profile';
import { Project } from './project';

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

  @OneToMany(() => Project, (project) => project.picture)
  projects: Project[];
}

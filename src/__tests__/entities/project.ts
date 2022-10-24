import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user';
import { Picture } from './picture';

@Entity()
export class Project {
  @PrimaryColumn({ type: 'integer', name: 'id_user' })
  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn([{ name: 'id_user', referencedColumnName: 'id' }])
  user: User;

  @PrimaryColumn({ type: 'integer', name: 'id_picture' })
  @ManyToOne(() => Picture, (picture) => picture.projects)
  @JoinColumn([{ name: 'id_picture', referencedColumnName: 'id' }])
  picture: Picture;
}

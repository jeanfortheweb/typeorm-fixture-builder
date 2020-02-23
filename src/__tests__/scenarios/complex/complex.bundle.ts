import { Group } from "../../entities/group";
import { User } from "../../entities/user";
import { Profile } from "../../entities/profile";
import { fixture } from "../../../fixture";
import { Picture } from "../../entities/picture";

export const picture1 = fixture(Picture, { file: "baz.jpg" });
export const picture2 = fixture(Picture, { file: "foo.jpg" });

export const groups = [
  fixture(Group, { name: "Group 1" }),
  fixture(Group, { name: "Group 2" })
];

export const nested = {
  users: {
    inner: {
      values: [
        fixture(User, {
          firstName: "User",
          lastName: "1",
          groups
        }),
        fixture(User, {
          firstName: "User",
          lastName: "2",
          groups,
          profile: fixture(Profile, {
            bio: "I am a test",
            pictures: [picture1]
          })
        })
      ]
    }
  }
};

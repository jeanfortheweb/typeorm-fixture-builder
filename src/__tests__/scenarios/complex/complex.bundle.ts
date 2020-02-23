import { Group } from "../../entities/group";
import { User } from "../../entities/user";
import { Profile } from "../../entities/profile";
import { fixture } from "../../../fixture";

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
          profile: fixture(Profile, { bio: "I am a test" })
        })
      ]
    }
  }
};

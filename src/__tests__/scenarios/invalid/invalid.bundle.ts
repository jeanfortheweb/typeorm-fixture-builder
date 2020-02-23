import { Group } from "../../entities/group";
import { User } from "../../entities/user";
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
        "i am invalid"
      ]
    }
  }
};

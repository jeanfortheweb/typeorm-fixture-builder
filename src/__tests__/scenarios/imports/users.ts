import { User } from "../../entities/user";
import { fixture } from "../../../fixture";
import { group1, group2 } from "./groups";

export const user1 = fixture(User, {
  firstName: "User",
  lastName: "1",
  groups: [group1]
});

export const user2 = fixture(User, {
  firstName: "User",
  lastName: "2",
  groups: [group1, group2]
});

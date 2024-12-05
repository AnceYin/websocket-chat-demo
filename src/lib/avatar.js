import {createAvatar} from "@dicebear/core";
import {avataaars, shapes} from "@dicebear/collection";

export default function getAvatarUrl (id, isGroup = false) {
  const avatar = createAvatar(isGroup ? shapes: avataaars, {
    seed: id,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    backgroundType: ["gradientLinear", "solid"],
    clothesColor: ["3c4f5c", "65c9ff", "262e33", "ff5c5c", "a7ffc4", "ffffb1"]
  });

  return avatar.toDataUri()
}

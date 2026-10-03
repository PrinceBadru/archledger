import { defineResource, field } from "@flaredev/core";

export default defineResource({
  name: "Decision",
  group: "Decisions",
  fields: {
    // generated:start hash=cfbedf52f398
    title: field.string(),
    body: field.markdown(),
    state: field.string(),
    tags: field.string({ required: false }),
    // generated:end
  },
});

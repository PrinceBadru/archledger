import { defineResource, field } from "@flaredev/core";

export default defineResource({
  name: "Component",
  group: "Catalog",
  fields: {
    // generated:start hash=820f2ecb9bd6
    name: field.string({ unique: true }),
    description: field.string({ required: false }),
    tags: field.string({ required: false }),
    lifecycleStage: field.string(),
    // generated:end
  },
});

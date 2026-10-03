import { defineResource, field } from "@flaredev/core";

export default defineResource({
  name: "Dependency",
  group: "Catalog",
  fields: {
    // generated:start hash=533664a31bba
    sourceId: field.belongsTo("Component"),
    targetId: field.belongsTo("Component"),
    type: field.string(),
    // generated:end
  },
});

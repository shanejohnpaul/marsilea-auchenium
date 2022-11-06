const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Folder Schema
const folderSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: [true, "User ID required"] },
    name: { type: String, required: [true, "Folder name required"] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: null } }
);

folderSchema.index({ user_id: 1, name: 1 });

module.exports = mongoose.model("Folder", folderSchema);

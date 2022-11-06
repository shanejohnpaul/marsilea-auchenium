const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// File Schema
const fileSchema = new Schema(
  {
    folder_id: { type: Schema.Types.ObjectId, required: [true, "Folder ID required"] },
    user_id: { type: Schema.Types.ObjectId, required: [true, "User ID required"] },
    name: { type: String, required: [true, "Folder name required"] },
    content: { type: String, required: [true, "Content required"] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: null } }
);

fileSchema.index({ user_id: 1, folder_id: 1 }); //compound index on user_id and folder_id

module.exports = mongoose.model("File", fileSchema);

const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const {
  isAdmin,
  auth,
  isInstructor,
  isStudent,
} = require("../middlewares/auth");
const {
  createCodingRoom,
  deleteCodingRoom,
  joinCodingRoom,
  updateParticipantRole,
  getAllCodingRooms,
} = require("../controllers/CodeRoom");

// create coding room
router.post("/create", auth, isInstructor, createCodingRoom);

// delete coding room
router.delete("/delete/:id", auth, isInstructor, deleteCodingRoom);

// join coding room
router.post("/join/:id", auth, joinCodingRoom);

// update participent role
router.post("/updaterole", auth, isInstructor, updateParticipantRole);

router.get("/get", auth, getAllCodingRooms);

module.exports = router;

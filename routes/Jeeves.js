var db = require("../models");
var passport = require("../config/passport");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { Op } = require("sequelize");

let req = {
  resStart_Time: "2020-04-16T19:30:00.000Z",
  resEnd_Time: "2020-04-16T20:00:00.000Z",
  Start_Time: "2020-04-12 2:30",
  End_Time: "2020-04-12 3:00",
  UserId: 1,
  instructorID: 2,
  session_ID: "ef4b99ae-dc09-4633-a7f1-b92feb993c8b",
};

const Jeeves = {
  createTimeSlot: async function(db, start, end, Id) {
    let sesh_id = uuidv4();
    //console.log(start,end,Id,sesh_id);
    db.reservations.create({
      start_Time: start,
      end_Time: end,
      instructorId: Id,
      session_ID: sesh_id,
    });
  },
  updateTimeSlot: async function(db, start, end, session, stat, user) {
    db.reservations.update(
      {
        start_Time: start,
        end_Time: end,
        status: stat,
        userID: user,
      },
      { where: { session_ID: session } }
    );
  },

  createReservation: async function(db, req) {
    let {
      Start_Time,
      End_Time,
      userId,
      instructorID,
      session_ID,
      resStart_Time,
      resEnd_Time,
    } = req.body;
    stat = "Booked";
    // entire time slot
    if (resStart_Time === Start_Time && req.resEnd_Time === End_Time) {
      Jeeves.updateTimeSlot(db, Start_Time, End_Time, session_ID, stat, userId);
    } else if (resStart_Time === Start_Time && resEnd_Time !== End_Time) {
      //   same start different end
      Jeeves.createTimeSlot(db, resEnd_Time, End_Time, instructorID);
      Jeeves.updateTimeSlot(
        db,
        Start_Time,
        resEnd_Time,
        session_ID,
        stat,
        userId
      );
    } else if (resStart_Time !== Start_Time && resEnd_Time === End_Time) {
      //   same end different start
      Jeeves.createTimeSlot(db, Start_Time, resStart_Time, instructorID);
      Jeeves.updateTimeSlot(
        db,
        resStart_Time,
        End_Time,
        session_ID,
        stat,
        userId
      );
    } else {
      // different start and end
      Jeeves.createTimeSlot(db, Start_Time, resStart_Time, instructorID);
      Jeeves.createTimeSlot(db, resEnd_Time, End_Time, instructorID);
      Jeeves.updateTimeSlot(
        db,
        resStart_Time,
        resEnd_Time,
        session_ID,
        stat,
        userId
      );
    }
  },
  cancelReservation: async function(db, start, end, session, user) {
    let stat = "Canceled";

    db.reservations.update(
      {
        start_Time: start,
        end_Time: end,
        status: stat,
        userID: user,
      },
      { where: { session_ID: session } }
    );

    createTimeSlot(db, start, end, instructorID);
  },
  viewAllReservations: async function(db) {
    let results;
    try {
      results = await db.reservations.findAll({
        where: { start_Time: { [Op.gte]: new Date() } },
        order: ["start_time"],
        include: [
          {
            model: db.users,
            as: "instructor",
          },
        ],
      });
    } catch (err) {
      console.log("Something went sideways", err);
    }

    let values = [];
    results.forEach((res) => {
      values.push({
        id: res.id,
        start: res.start_Time,
        end: res.end_Time,
        instructor: res.instructor.first_name + " " + res.instructor.last_name,
        instructorID: res.instructorId,
        status: res.status,
        reservation_number: res.session_ID,
      });
    });
    return values;
  },

  viewAllUserReservations: async function(db, req) {
    let results;
    try {
      results = await db.reservations.findAll({
        where: { userId: req.user.id, start_Time: { [Op.gte]: new Date() } },
        order: ["start_time"],
        include: [
          {
            model: db.users,
          },
          {
            model: db.users,
            as: "instructor",
          },
        ],
      });
    } catch (err) {
      console.log("Something went sideways", err);
    }

    let values = [];
    results.forEach((res) => {
      values.push({
        id: res.id,
        start: res.start_Time,
        end: res.end_Time,
        instructor: res.instructor.first_name + " " + res.instructor.last_name,
        customer: res.user.first_name + " " + res.user.last_name,
        email: res.user.email,
        status: res.status,
        reservation_number: res.session_ID,
      });
    });
    return values;
  },
};

module.exports = Jeeves;
//Jeeves.createReservation(db, req);

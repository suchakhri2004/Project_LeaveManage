import { Request, Response } from "express";
import { pool } from "../db/client";
import bcrypt from "bcrypt";
import {
  RequestWithToken,
} from "../authen/authMiddleware";

export const createUserAndAdmin = async (req: RequestWithToken, res: Response) => {
  try {
    const { username,password,firstname,lastname,gender,email,profile,signature,position_id,affiliation_id } = req.body;

    const hashPassword = await bcrypt.hash(password, 10);

    if (!req.body.position_id) {
      return res.status(400).send(`Position not selected`)
    }
    if (!req.body.affiliation_id) {
      return res.status(400).send(`affiliation not selected`)
    }
    

    const checkUsername = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (checkUsername.rows.length > 0) {
      return res.status(400).send(`Username has already been used`);
    }

    //สร้าง user ขึ้นมา
      const result = await pool.query(
        "INSERT INTO users (username,password,firstname,lastname,gender,email,profile,signature,position_id,affiliation_id,isactive) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
        [
          username,
          hashPassword,
          firstname,
          lastname,
          gender,
          email,
          profile,
          signature,
          position_id,
          affiliation_id,
          true
        ]
      );
      
      const user = result.rows[0];
      const currentYear = new Date().getFullYear();
      
        const typePosition = ( await pool.query(`
          SELECT tp.leavesick, tp.leavebusy, tp.leavevacation
          FROM position p 
          JOIN typesposition tp ON p.typepositionid = tp.id 
          WHERE p.id = $1`,[position_id]
        )).rows[0];

      const leaveTypes = (await pool.query("SELECT * FROM leavetypes")).rows;

      const leaveTypeMapping: Record<string, number> = {
      "ลาป่วย" : typePosition.leavesick,
      "ลากิจส่วนตัว" : typePosition.leavebusy,
      "ลาพักผ่อน" : typePosition.leavevacation,
      };

      for (const type of leaveTypes) {
      const totalDays = leaveTypeMapping[type.name] || 0;
      await pool.query(
        "INSERT INTO leavebalance (user_id, leavetype_id, total_days, used_days, year) VALUES ($1, $2, $3, $4, $5)",
        [
          user.id,
          type.id,
          totalDays,
          0,
          currentYear,
        ]
          );
        }
      
      return res.status(200).send(`Complete Create`);
    
  } catch (error) {
    res.status(404).send(error);
  }
};

export const updateStatusMaster = async ( req: RequestWithToken, res: Response ) => {
  const {id} = req.params;
  try {
    const checkStatus = await pool.query(
      `SELECT isactive FROM users WHERE id = $1`,
      [id]
    );
    const checkid = await pool.query(`SELECT id FROM users WHERE id = $1`, [
      id,
    ]);
    if (checkid.rows.length === 0) {
      return res.status(404).send(`ID Not Found`);
    }

    let result;

    if (checkStatus.rows[0].isactive === true) {
  result = await pool.query(
    `UPDATE users SET isactive = $1, updatedat = $2 WHERE id = $3 RETURNING *`,
    [false, new Date(), id]
  );
}
if (checkStatus.rows[0].isactive === false) {
  result = await pool.query(
    `UPDATE users SET isactive = $1, updatedat = $2 WHERE id = $3 RETURNING *`,
    [true, new Date(), id]
  );
}

    
    const position = (await pool.query(
      `SELECT p.positionname 
       FROM users u 
       JOIN position p ON u.position_id = p.id
       WHERE u.id = $1`,[id]
    )
  ).rows[0].positionname;

    res.status(200).json({
      firstname: result?.rows[0].firstname,
      lastname: result?.rows[0].lastname,
      position: position,
      isactive: result?.rows[0].isactive,
    });
  } catch (error) {
    res.status(500).send(error);
  }
};
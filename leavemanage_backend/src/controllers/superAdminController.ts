import { Request, Response } from "express";
import { pool } from "../db/client";
import bcrypt from "bcrypt";
import {
  RequestWithToken,
} from "../authen/authMiddleware";

export const createUserAndAdmin = async (req: RequestWithToken, res: Response) => {
  try {
    const { username,password,firstname,lastname,gender,email,profile,position_id,affiliation_id = null ,prefix } = req.body;

    const hashPassword = await bcrypt.hash(password, 10);

    if (!req.body.position_id) {
      return res.status(400).send(`Position not selected`)
    }
    

    const checkUsername = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (checkUsername.rows.length > 0) {
      return res.status(400).send(`Username has already been used`);
    }

    const checkName = await pool.query(
      "SELECT * FROM users WHERE firstname = $1",
      [firstname]
    );
    if (checkName.rows.length > 0) {
      return res.status(400).send(`Firstname has already been used`);
    }

    const affiliationIdParsed = !affiliation_id || affiliation_id === '' ? null : affiliation_id;
    
      const result = await pool.query(
        "INSERT INTO users (username,password,firstname,lastname,gender,email,profile,position_id,affiliation_id,prefix,isactive) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
        [
          username,
          hashPassword,
          firstname,
          lastname,
          gender,
          email,
          profile,
          position_id,
          affiliationIdParsed,
          prefix,
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
        "INSERT INTO leavebalance (user_id, leavetype_id, total_days, used_days, year, isactive) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          user.id,
          type.id,
          totalDays,
          0,
          currentYear,
          true
        ]
          );
        }
      
      return res.status(200).send(`Complete Create`);
    
  } catch (error) {
    res.status(404).send(error);
  }
};

export const editUser = async (req: RequestWithToken, res: Response) => {
  const { id } = req.params;
  const { profile,firstname, lastname, email, affiliation_id, position_id } = req.body;

  if (!profile || !firstname || !lastname || !email || !affiliation_id || !position_id) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET 
        profile = $1,
        firstname = $2,
        lastname = $3,
        email = $4,
        affiliation_id = $5,
        position_id = $6,
        updatedat = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, firstname, lastname, email, affiliation_id, position_id;
      `,
      [profile,firstname, lastname, email, affiliation_id, position_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งานที่ต้องการแก้ไข" });
    }

    res.status(200).json({ message: "แก้ไขข้อมูลผู้ใช้สำเร็จ", user: result.rows[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้" });
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

export const countusers = async (req : RequestWithToken, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE r.rolename != 'SADMIN'
        ) AS total_users,
        
        COUNT(*) FILTER (
          WHERE u.isactive = true AND r.rolename != 'SADMIN'
        ) AS active_users,
        
        COUNT(*) FILTER (
          WHERE u.isactive = false AND r.rolename != 'SADMIN'
        ) AS inactive_users

      FROM users u
      LEFT JOIN position p ON u.position_id = p.id
      LEFT JOIN roles r ON p.roleid = r.id
    `);

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error.');
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  const searchTerm = req.query.q as string;

  try {
    let users;

    if (!searchTerm || searchTerm.trim() === '') {
      const result = await pool.query(
        `SELECT 
            u.id, u.prefix, u.username, u.firstname, u.lastname, u.email, 
            u.gender, u.isactive, u.profile, u.affiliation_id, u.position_id,
            a.name AS affiliation_name,
            p.positionname AS position_name
         FROM users u
         LEFT JOIN affiliation a ON u.affiliation_id = a.id
         LEFT JOIN position p ON u.position_id = p.id
         LEFT JOIN roles r ON p.roleid = r.id
         WHERE r.rolename != 'SADMIN'
         ORDER BY u.createdAt DESC
         LIMIT 7`
      );
      users = result.rows;
    } else {
      const result = await pool.query(
        `SELECT 
            u.id, u.prefix, u.username, u.firstname, u.lastname, u.email, 
            u.gender, u.isactive, u.profile, u.affiliation_id, u.position_id,
            a.name AS affiliation_name,
            p.positionname AS position_name
         FROM users u
         LEFT JOIN affiliation a ON u.affiliation_id = a.id
         LEFT JOIN position p ON u.position_id = p.id
         LEFT JOIN roles r ON p.roleid = r.id
         WHERE r.rolename != 'SADMIN'
           AND LOWER(u.prefix || ' ' || u.firstname || ' ' || u.lastname) LIKE LOWER($1)
         ORDER BY u.createdAt DESC
         LIMIT 7`,
        [`%${searchTerm}%`]
      );
      users = result.rows;
    }

    res.status(200).json(users);
  } catch (err) {
    console.error('searchUsers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getValueAffiliation = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name FROM affiliation ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching affiliations:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสังกัด' });
  }
};

export const getValuePosition = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, positionname 
       FROM position 
       WHERE positionname NOT ILIKE 'superadmin'
       ORDER BY positionname`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง' });
  }
};

export const editLeaveDay = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { leaveUpdates } = req.body;
  const year = new Date().getFullYear();

  if (!Array.isArray(leaveUpdates) || leaveUpdates.length === 0) {
    return res.status(400).json({ message: 'กรุณาระบุ leaveUpdates อย่างน้อยหนึ่งรายการ' });
  }
  try {

      const results: { id: string; leavetype_id: string; total_days: number }[] = [];

      for (const update of leaveUpdates) {
        const { leavetype_id, total_days } = update;

        if (!leavetype_id || total_days === undefined) continue;

        const updated = await pool.query(
          `UPDATE leavebalance
          SET total_days = $1, updatedAt = CURRENT_TIMESTAMP
          WHERE user_id = $2 AND leavetype_id = $3 AND year = $4
          RETURNING id, leavetype_id, total_days`,
          [total_days, id, leavetype_id, year]
        );

        if (updated.rowCount! > 0) {
          results.push(updated.rows[0]);
        }
      }


    res.status(200).json({
      message: 'อัปเดตวันลาสำเร็จ',
      updated: results,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
};

export const leaveBalanceByID = async ( req: RequestWithToken, res: Response ) => {
  const {id} = req.params
  try {
   if (!id) {
    return res.status(400).send('User ID notfound');
   }

    const result = await pool.query(`
      SELECT lb.total_days, lb.used_days, lt.name, lt.id AS leavetype_id
      FROM leavetypes lt
      JOIN leavebalance lb ON lt.id = lb.leavetype_id
      WHERE lb.user_id = $1 AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [id]
    );


    if (result.rows.length === 0) {
  
      return res.status(404).send('Leave balance not found for this user.');
    }

    return res.status(200).json(result.rows);

  } catch (error) {
    return res.status(500).send('Internal Server Error.');
  }
};




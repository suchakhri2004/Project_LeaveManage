import { Request, Response } from "express";
import { pool } from "../db/client";
import { RequestWithToken } from "../authen/authMiddleware";
import { json } from "body-parser";

async function getPublicHolidaysBetweenYears(startYear: number, endYear: number): Promise<Set<string>> {
  const result = await pool.query(
    `SELECT holiday_dates FROM public_holidays WHERE year BETWEEN $1 AND $2`,
    [startYear, endYear]
  );

  const holidays = new Set<string>();

  result.rows.forEach(row => {
    row.holiday_dates.forEach((dateVal: Date | string) => {
      const dateStr = (typeof dateVal === "string") ? dateVal : dateVal.toISOString().slice(0,10);
      holidays.add(dateStr);
    });
  });

  return holidays;
}


async function countWorkingDaysExcludingHolidays(startDate: Date, endDate: Date): Promise<number> {
  if (startDate > endDate) return 0;

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const holidays = await getPublicHolidaysBetweenYears(startYear, endYear);

  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    const dateStr = currentDate.toISOString().slice(0, 10); 

    if (day !== 0 && day !== 6 && !holidays.has(dateStr)) {
      count++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

export const leaveRequest = async (req: RequestWithToken, res: Response) => {
  try {
    const proof_image_url = req.body.proof_image_url || null;
    
    const {
      leavetype_id,
      reason,
      datefrom,
      dateto,
      contact,
      responsible_person_id,
    } = req.body;

    if (!datefrom || !dateto || !leavetype_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const startDate = new Date(datefrom);
    const endDate = new Date(dateto);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format in leave request." });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: "Start date cannot be after end date." });
    }

    const dayCount = await countWorkingDaysExcludingHolidays(startDate, endDate);

    const daysbalance = await pool.query(
      `SELECT total_days, used_days FROM leavebalance WHERE user_id = $1 AND leavetype_id = $2 AND year = $3 AND isactive = true`,
      [req.token?.id, leavetype_id, new Date().getFullYear()]
    );

    const resultDaysTotal = daysbalance.rows[0].total_days - daysbalance.rows[0].used_days;

    const leavetypenameResult = await pool.query(
      `SELECT name FROM leavetypes WHERE id = $1`,
      [leavetype_id]
    );

    const leavetypename = leavetypenameResult.rows[0]?.name || "this leave type";

    if (dayCount > resultDaysTotal) {
      return res.status(400).json({
        error: `Cannot request leave because you do not have enough remaining days for leave type: ${leavetypename}`
      });
    }

    const checkPosition = await pool.query(
      `SELECT * FROM position WHERE id = $1`,
      [req.token?.position_id]
    );

    const checkRole = await pool.query(
      `SELECT rolename FROM roles WHERE id = $1`,
      [checkPosition.rows[0].roleid]
    );

    const currentYear = new Date().getFullYear();
    const latestNumRequestResult = await pool.query(
      `SELECT numrequest FROM leaverequest 
       WHERE EXTRACT(YEAR FROM createdat) = $1 
       ORDER BY numrequest DESC 
       LIMIT 1`,
      [currentYear]
    );
    let nextNumRequest = 1;
    if (latestNumRequestResult.rows.length > 0) {
      nextNumRequest = parseInt(latestNumRequestResult.rows[0].numrequest) + 1;
    }

    const commonFields = [
      req.token?.id,
      leavetype_id,
      reason,
      proof_image_url,
      datefrom,
      dateto,
      contact,
      responsible_person_id,
      true,
      new Date(),
      nextNumRequest
    ];

    // User
    if (checkRole.rows[0].rolename === "EMPLOYEE") {
      const query = `
        INSERT INTO leaverequest (
          employee_id, leavetype_id, reason, proof_image_url, datefrom, dateto, contact, responsible_person_id, status1, status1_update, numrequest
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id;
      `;

      const result = await pool.query(query, commonFields);
      return res.status(200).json({
        message: "Send Success",
        totalLeave: `TotalLeave ${dayCount} working days`,
        leaveRequestId: result.rows[0].id,
      });
    }

    // APPROVE
    const baseFields = [...commonFields];

    if (checkPosition.rows[0].positionname === "นักทรัพยากรบุคคลชำนาญการ") {
      const query = `
        INSERT INTO leaverequest (
          employee_id, leavetype_id, reason, proof_image_url, datefrom, dateto, contact, responsible_person_id, status1, status1_update, numrequest, hr_id, status2, status2_update
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id;
      `;

      const values = [...baseFields, req.token?.id, true, new Date()];
      const result = await pool.query(query, values);
      return res.status(200).json({
        message: "Send Success",
        totalLeave: `TotalLeave ${dayCount} working days`,
        leaveRequestId: result.rows[0].id,
      });
    }

    if (checkPosition.rows[0].positionname === "ผู้บังคับบัญชา") {
      const query = `
        INSERT INTO leaverequest (
          employee_id, leavetype_id, reason, proof_image_url, datefrom, dateto, contact, responsible_person_id, status1, status1_update, numrequest, status3, status3_update
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id;
      `;

      const values = [...baseFields, true, new Date()];
      const result = await pool.query(query, values);
      return res.status(200).json({
        message: "Send Success",
        totalLeave: `TotalLeave ${dayCount} working days`,
        leaveRequestId: result.rows[0].id,
      });
    }

    if (checkPosition.rows[0].positionname === "รองปลัดเทศบาล1" || checkPosition.rows[0].positionname === "รองปลัดเทศบาล2") {
      const query = `
        INSERT INTO leaverequest (
          employee_id, leavetype_id, reason, proof_image_url, datefrom, dateto, contact, responsible_person_id, status1, status1_update, numrequest, status3, status3_update, status4, status4_update
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id;
      `;

      const values = [...baseFields, true, new Date(), true, new Date()];
      const result = await pool.query(query, values);
      return res.status(200).json({
        message: "Send Success",
        totalLeave: `TotalLeave ${dayCount} working days`,
        leaveRequestId: result.rows[0].id,
      });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};


export const acceptHr = async (req: RequestWithToken, res: Response) => {
  const { id } = req.params;
  const { boolean = true } = req.body;

  try {
    const checkFrom = await pool.query(`SELECT id FROM leaverequest WHERE id = $1`, [id]);
    if (checkFrom.rows.length === 0) return res.status(404).send(`ID Not Found`);

    const checkPosition = await pool.query(
      `SELECT positionname FROM position WHERE id = $1`,
      [req.token?.position_id]
    );

    if (checkPosition.rows[0].positionname !== "นักทรัพยากรบุคคลชำนาญการ") {
      return res.status(403).json({ error: "Unauthorized action" });
    }

    await pool.query(
      `UPDATE leaverequest 
       SET hr_id = $1, status2 = $2, status2_update = $3 
       WHERE id = $4`,
      [req.token?.id, boolean, new Date(), id]
    );

    return res.status(200).json({ message: "Accept Success" });

  } catch (error) {
    res.status(500).send(error);
  }
};


export const opinionsOnly = async (req: RequestWithToken, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const checkFrom = await pool.query(`SELECT id FROM leaverequest WHERE id = $1`, [id]);
    if (checkFrom.rows.length === 0) return res.status(404).send(`ID Not Found`);

    const checkPosition = await pool.query(
      `SELECT positionname FROM position WHERE id = $1`,
      [req.token?.position_id]
    );

    if (checkPosition.rows[0].positionname === "ผู้บังคับบัญชา") {
      await pool.query(
        `UPDATE leaverequest SET supervisor_id = $1 , supervisor_note = $2 , status3 = $3 , status3_update = $4 WHERE id = $5 `,
        [req.token?.id, note, true, new Date(), id]
      );
    } else if (checkPosition.rows[0].positionname === "รองปลัดเทศบาล1" || checkPosition.rows[0].positionname === "รองปลัดเทศบาล2") {
      await pool.query(
        `UPDATE leaverequest SET deputymayor_id = $1 , deputymayor_note = $2 , status4 = $3 , status4_update = $4 WHERE id = $5 `,
        [req.token?.id, note, true, new Date(), id]
      );
    }

    return res.status(200).json({ message: "Comment Success" });

  } catch (error) {
    res.status(500).send(error);
  }
};

export const approveLeaveRequest = async (req: RequestWithToken, res: Response) => {
  const { id } = req.params;
  const { note, boolean } = req.body;

  try {
    const checkFrom = await pool.query(`SELECT * FROM leaverequest WHERE id = $1`, [id]);
    if (checkFrom.rows.length === 0) return res.status(404).send(`ID Not Found`);

    const checkPosition = await pool.query(
      `SELECT positionname FROM position WHERE id = $1`,
      [req.token?.position_id]
    );

    if (checkPosition.rows[0].positionname !== "ปลัดเทศบาล") {
      return res.status(403).json({ error: "Unauthorized action" });
    }

    await pool.query(
      `UPDATE leaverequest 
       SET mayor_id = $1, 
           mayor_note = $2, 
           status5 = $3, 
           status5_update = $4 
       WHERE id = $5`,
      [req.token?.id, note, boolean, new Date(), id]
    );

    if (boolean === true) {
      const startDate = new Date(checkFrom.rows[0].datefrom);
      const endDate = new Date(checkFrom.rows[0].dateto);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format in leave request." });
      }

      if (startDate > endDate) {
        return res.status(400).json({ error: "Start date cannot be after end date." });
      }

      const dayCount = await countWorkingDaysExcludingHolidays(startDate, endDate);

      await pool.query(
        `UPDATE leavebalance 
         SET used_days = used_days + $1, 
             updatedat = $2 
         WHERE user_id = $3 
           AND leavetype_id = $4 
           AND year = $5`,
        [
          dayCount,
          new Date(),
          checkFrom.rows[0].employee_id,
          checkFrom.rows[0].leavetype_id,
          new Date().getFullYear()
        ]
      );
    }

    return res.status(200).json({ message: "Processed successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};


// export const rejectLeaveRequest = async (req: RequestWithToken, res: Response) => {
//   const { id } = req.params;
//   const { note } = req.body;

//   try {
//     const checkFrom = await pool.query(`SELECT id FROM leaverequest WHERE id = $1`, [id]);
//     if (checkFrom.rows.length === 0) return res.status(404).send(`ID Not Found`);

//     const checkPosition = await pool.query(
//       `SELECT positionname FROM position WHERE id = $1`,
//       [req.token?.position_id]
//     );

//     if (checkPosition.rows[0].positionname === "นักทรัพยากรบุคคลชำนาญการ") {
//       await pool.query(
//         `UPDATE leaverequest SET hr_id = $1 , hr_note = $2 , status2 = $3 , status2_update = $4 WHERE id = $5 `,
//         [req.token?.id, note, false, new Date(), id]
//       );
//     } else if (checkPosition.rows[0].positionname === "ผู้บังคับบัญชา") {
//       await pool.query(
//         `UPDATE leaverequest SET mayor_id = $1 , mayor_note = $2 , status5 = $3 , status5_update = $4 WHERE id = $5 `,
//         [req.token?.id, note, false, new Date(), id]
//       );
//     }

//     return res.status(200).json({ message: "Reject Success" });

//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

export const getValueLeaveType = async (req:Request, res:Response) => {
  try {
    const result = await pool.query('SELECT id, name FROM leavetypes ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทการลา' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    let query = `
      SELECT u.id, u.firstname, u.lastname 
      FROM users u
      JOIN position p ON u.position_id = p.id
      JOIN roles r ON p.roleid = r.id
      WHERE u.isactive = true AND r.rolename != 'SADMIN'
    `;
    const values: any[] = [];

    if (search && typeof search === 'string') {
      query += ` AND (u.firstname ILIKE $1 OR u.lastname ILIKE $1)`;
      values.push(`%${search}%`);
    }

    query += ` ORDER BY u.firstname`;

    const result = await pool.query(query, values);
    const formatted = result.rows.map(user => ({
      id: user.id,
      name: `${user.firstname} ${user.lastname}`,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
  }
};


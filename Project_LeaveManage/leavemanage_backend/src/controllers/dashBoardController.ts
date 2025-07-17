import { Request, Response } from "express";
import { pool } from "../db/client";
import {
  RequestWithToken,
} from "../authen/authMiddleware";

export const leaveBalance = async ( req: RequestWithToken, res: Response ) => {
  try {
   if (!req.token?.id) {
    return res.status(400).send('User ID notfound');
   }

   const result = await pool.query(`
    SELECT lb.total_days, lb.used_days, lt.name
            FROM leavetypes lt
            JOIN leavebalance lb ON lt.id = lb.leavetype_id
            WHERE lb.user_id = $1`, 
            [req.token.id]
   );

    if (result.rows.length === 0) {
  
      return res.status(404).send('Leave balance not found for this user.');
    }

    return res.status(200).json(result.rows);

  } catch (error) {
    return res.status(500).send('Internal Server Error.');
  }
};

export const leaveBalanceById = async (req: Request, res: Response) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const result = await pool.query(
      `
      SELECT lb.total_days, lb.used_days, lt.name
      FROM leavetypes lt
      JOIN leavebalance lb ON lt.id = lb.leavetype_id
      WHERE lb.user_id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Leave balance not found for this user');
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
};


export const getProfile = async (req: RequestWithToken, res:Response) => {
    try {
   if (!req.token?.id) {
    return res.status(400).send('User ID notfound');
   }

   const result = await pool.query(`
    SELECT 
        u.firstname, 
        u.lastname, 
        u.email, 
        u.profile, 
        u.gender,
        p.positionname, 
        a.name AS affiliation_name
    FROM users u
    JOIN position p ON u.position_id = p.id
    LEFT JOIN affiliation a ON u.affiliation_id = a.id
    WHERE u.id = $1
    `, [req.token.id]
   );

    if (result.rows.length === 0) {
  
      return res.status(404).send('Profile not found for this user.');
    }

    return res.status(200).json(result.rows);

  } catch (error) {
    return res.status(500).send('Internal Server Error.');
  }
}

export const getProfileById = async (req: Request, res: Response) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const result = await pool.query(
      `
      SELECT 
          u.firstname, 
          u.lastname, 
          u.email, 
          u.profile, 
          u.gender,
          p.positionname, 
          a.name AS affiliation_name
      FROM users u
      JOIN position p ON u.position_id = p.id
      LEFT JOIN affiliation a ON u.affiliation_id = a.id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
};


export const leaveHistory = async (req: RequestWithToken, res: Response) => {
  try {
    if (!req.token?.id) {
      return res.status(400).send('User ID not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM leaverequest WHERE employee_id = $1
    `, [req.token.id]);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT 
          lr.numrequest,
          lr.id,
          lr.createdAt,
          lt.name AS leave_type_name,
          lr.status1,
          lr.status2,
          lr.status5
      FROM leaverequest lr
      JOIN leavetypes lt ON lr.leavetype_id = lt.id
      WHERE lr.employee_id = $1
      ORDER BY lr.createdAt DESC
      LIMIT $2 OFFSET $3
    `, [req.token.id, limit, offset]);

    const mapped = result.rows.map(row => {
      let statusText = 'unknown';

      if (row.status1 === true && row.status2 === null) {
        statusText = 'กำลังดำเนินการ';
      } else if (row.status1 === true && row.status2 === false) {
        statusText = 'ไม่สำเร็จ';
      } else if (row.status1 === true && row.status2 === true && row.status5 === null) {
        statusText = 'กำลังดำเนินการ';
      } else if (row.status1 === true && row.status2 === true && row.status5 === false) {
        statusText = 'ไม่สำเร็จ';
      } else if (row.status1 === true && row.status2 === true && row.status5 === true) {
        statusText = 'สำเร็จ';
      }

      return {
        numrequest: row.numrequest,
        id: row.id,
        createdAt: row.createdat,
        leave_type_name: row.leave_type_name,
        status: statusText
      };
    });

    return res.status(200).json({
      data: mapped,
      total,
      page,
      limit
    });

  } catch (error) {
    console.error('Error fetching leave history:', error);
    return res.status(500).send('Internal Server Error.');
  }
};


export const leaveData = async (req: RequestWithToken, res: Response) => {
  try {
    const { id } = req.params;
    if(!id){
      return res.status(400).send('LeaveRequest ID not found');
    }
    if (!req.token?.id) {
      return res.status(400).send('User ID not found');
    }

        const result = await pool.query(`
  SELECT 
    lr.status1,
    lr.status1_update,
    u1.firstname AS responsible_firstname,
    u1.lastname AS responsible_lastname,
    lr.status2,
    lr.status2_update,
    u2.firstname AS hr_firstname,
    u2.lastname AS hr_lastname,
    lr.status3,
    lr.status3_update,
    u3.firstname AS supervisor_firstname,
    u3.lastname AS supervisor_lastname,
    lr.status4,
    lr.status4_update,
    u4.firstname AS deputymayor_firstname,
    u4.lastname AS deputymayor_lastname,
    lr.status5,
    lr.status5_update,
    u5.firstname AS mayor_firstname,
    u5.lastname AS mayor_lastname,
    lr.mayor_note
 
  FROM leaverequest lr
  LEFT JOIN users u1 ON lr.responsible_person_id = u1.id
  LEFT JOIN users u2 ON lr.hr_id = u2.id
  LEFT JOIN users u3 ON lr.supervisor_id = u3.id
  LEFT JOIN users u4 ON lr.deputymayor_id = u4.id
  LEFT JOIN users u5 ON lr.mayor_id = u5.id
  WHERE lr.id = $1
`, [id]);


    return res.status(200).send(result.rows)

  } catch (error) {
    console.error('Error fetching leave data:', error);
    return res.status(500).send('Internal Server Error.');
  }
};

export const viewLeaveRequest = async (req: RequestWithToken, res: Response) => {
  try {
    if (!req.token?.id) {
      return res.status(400).send('User ID not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const position = await pool.query(`
      SELECT positionname FROM position WHERE id = $1
    `, [req.token.position_id]);

    const posName = position.rows[0].positionname;
    let countQuery = '';
    let dataQuery = '';
    let queryParams: any[] = [];
    let countParams: any[] = [];

    if (posName === `นักทรัพยากรบุคคลชำนาญการ`) {
      countQuery = `
        SELECT COUNT(*) FROM leaverequest WHERE status1 IS TRUE AND status2 IS NULL
      `;
      dataQuery = `
        SELECT 
          lr.numrequest,
          u.firstname,
          u.lastname,
          lr.id,
          lr.employee_id,
          lr.createdAt,
          lt.name AS leave_type_name,
          lr.datefrom,
          lr.dateto
        FROM leaverequest lr
        JOIN leavetypes lt ON lr.leavetype_id = lt.id
        JOIN users u ON lr.employee_id = u.id
        WHERE lr.status1 IS TRUE AND lr.status2 IS NULL
        ORDER BY lr.createdAt DESC
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
    }

    else if (posName === `ผู้บังคับบัญชา`) {
      countQuery = `
        SELECT COUNT(*) FROM leaverequest lr 
        JOIN users u ON lr.employee_id = u.id 
        WHERE lr.status2 IS TRUE AND lr.status3 IS NULL AND u.affiliation_id = $1
      `;
      dataQuery = `
        SELECT 
          lr.numrequest,
          u.firstname,
          u.lastname,
          lr.id,
          lr.employee_id,
          lr.createdAt,
          lt.name AS leave_type_name,
          lr.datefrom,
          lr.dateto
        FROM leaverequest lr
        JOIN leavetypes lt ON lr.leavetype_id = lt.id
        JOIN users u ON lr.employee_id = u.id 
        WHERE lr.status2 IS TRUE
          AND lr.status3 IS NULL
          AND u.affiliation_id = $1
        ORDER BY lr.createdAt DESC
        LIMIT $2 OFFSET $3
      `;
      queryParams = [req.token.affiliation_id, limit, offset];
      countParams = [req.token.affiliation_id];
    }

    else if (posName === `รองปลัดเทศบาล1`) {
      countQuery = `
        SELECT COUNT(*) FROM leaverequest lr
        JOIN users u ON lr.employee_id = u.id
        LEFT JOIN affiliation a ON u.affiliation_id = a.id
        WHERE lr.status3 IS TRUE AND lr.status4 IS NULL AND a.ordinal BETWEEN 1 AND 4
      `;
      dataQuery = `
        SELECT 
          lr.numrequest,
          u.firstname,
          u.lastname,
          lr.id,
          lr.employee_id,
          lr.createdAt,
          lt.name AS leave_type_name,
          lr.datefrom,
          lr.dateto
        FROM leaverequest lr
        JOIN leavetypes lt ON lr.leavetype_id = lt.id
        JOIN users u ON lr.employee_id = u.id
        LEFT JOIN affiliation a ON u.affiliation_id = a.id
        WHERE lr.status2 IS TRUE
          AND lr.status3 IS TRUE
          AND lr.status4 IS NULL
          AND a.ordinal BETWEEN 1 AND 4
        ORDER BY lr.createdAt DESC
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
    }

    else if (posName === `รองปลัดเทศบาล2`) {
      countQuery = `
        SELECT COUNT(*) FROM leaverequest lr
        JOIN users u ON lr.employee_id = u.id
        LEFT JOIN affiliation a ON u.affiliation_id = a.id
        WHERE lr.status3 IS TRUE AND lr.status4 IS NULL AND a.ordinal BETWEEN 5 AND 7
      `;
      dataQuery = `
        SELECT 
          lr.numrequest,
          u.firstname,
          u.lastname,
          lr.id,
          lr.employee_id,
          lr.createdAt,
          lt.name AS leave_type_name,
          lr.datefrom,
          lr.dateto
        FROM leaverequest lr
        JOIN leavetypes lt ON lr.leavetype_id = lt.id
        JOIN users u ON lr.employee_id = u.id
        LEFT JOIN affiliation a ON u.affiliation_id = a.id
        WHERE lr.status2 IS TRUE
          AND lr.status3 IS TRUE
          AND lr.status4 IS NULL
          AND a.ordinal BETWEEN 5 AND 7
        ORDER BY lr.createdAt DESC
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
    }

    else if (posName === `ปลัดเทศบาล`) {
      countQuery = `
        SELECT COUNT(*) FROM leaverequest WHERE status4 IS TRUE AND status5 IS NULL
      `;
      dataQuery = `
        SELECT 
          lr.numrequest,
          u.firstname,
          u.lastname,
          lr.id,
          lr.employee_id,
          lr.createdAt,
          lt.name AS leave_type_name,
          lr.datefrom,
          lr.dateto
        FROM leaverequest lr
        JOIN leavetypes lt ON lr.leavetype_id = lt.id
        JOIN users u ON lr.employee_id = u.id
        WHERE lr.status2 IS TRUE 
          AND lr.status3 IS TRUE
          AND lr.status4 IS TRUE
          AND lr.status5 IS NULL
        ORDER BY lr.createdAt DESC
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
    }

    if (!dataQuery) {
      return res.status(400).json({ error: 'Unauthorized position' });
    }

    const count = await pool.query(countQuery, countParams.length ? countParams : []);
    const total = parseInt(count.rows[0].count);
    const data = await pool.query(dataQuery, queryParams);

    return res.status(200).json({
      data: data.rows,
      total,
      page,
      limit
    });

  } catch (error) {
    console.error('Error fetching leave request:', error);
    return res.status(500).send('Internal Server Error.');
  }
};



export const viewLeaveRequestById = async (req: RequestWithToken, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.token?.id) return res.status(400).send('User ID not found');

    const positionRes = await pool.query(
      `SELECT positionname FROM position WHERE id = $1`,
      [req.token.position_id]
    );
    const position = positionRes.rows[0]?.positionname;

    const result = await pool.query(`
      SELECT 
        CONCAT(emp.firstname, ' ', emp.lastname) AS employee_name,
        lr.reason,
        lr.proof_image_url,
        lr.contact,
        CONCAT(rep.firstname, ' ', rep.lastname) AS responsible_person_name,
        lt.name AS leave_type_name,
        lr.datefrom,
        lr.dateto,
        lr.status2,
        lr.status3,
        lr.status4,
        lr.supervisor_note,
        lr.deputymayor_note
      FROM leaverequest lr
      JOIN users emp ON lr.employee_id = emp.id
      JOIN users rep ON lr.responsible_person_id = rep.id
      JOIN leavetypes lt ON lr.leavetype_id = lt.id
      WHERE lr.id = $1
    `, [id]);

    if (result.rowCount === 0) return res.status(404).send('Request not found');

    const data = result.rows[0];
    const filtered = {
      employee_name: data.employee_name,
      reason: data.reason,
      proof_image_url: data.proof_image_url, // Changed to match the actual column name
      contact: data.contact,
      responsible_person_name: data.responsible_person_name,
      leave_type_name: data.leave_type_name,
      datefrom: data.datefrom,
      dateto: data.dateto,
      status2: null,
      status3: null,
      status4: null,
      supervisor_note: null,
      deputymayor_note: null,
    };

    if (position === 'ผู้บังคับบัญชา') {
      filtered.status2 = data.status2;
    }

    if (position === 'รองปลัดเทศบาล1' || position === 'รองปลัดเทศบาล2') {
      filtered.status2 = data.status2;
      filtered.status3 = data.status3;
      filtered.supervisor_note = data.supervisor_note;
    }

    if (position === 'ปลัดเทศบาล') {
      filtered.status2 = data.status2;
      filtered.status3 = data.status3;
      filtered.status4 = data.status4;
      filtered.supervisor_note = data.supervisor_note;
      filtered.deputymayor_note = data.deputymayor_note;
    }

    return res.status(200).json(filtered);
  } catch (error) {
    console.error('Error fetching leave request by ID:', error);
    return res.status(500).send('Internal Server Error');
  }
};

export const getIndividualLeaveStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID parameter" });
    }

    const query = `
      SELECT
        lt.name AS leave_type_name,
        lb.used_days
      FROM leavebalance lb
      JOIN leavetypes lt ON lb.leavetype_id = lt.id
      WHERE lb.user_id = $1
        AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
      ORDER BY lt.name
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      userId,
      leaveBalances: result.rows, // [{ leave_type_name, used_days }]
    });
  } catch (error) {
    console.error("Error fetching individual leave stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export const getWeeklyLeaveStats = async (req: Request, res: Response) => {
  try {
    const weekStartQuery = `
      SELECT 
        date_trunc('week', current_date)::date AS week_start,
        (date_trunc('week', current_date) + interval '6 days')::date AS week_end
    `;
    const weekRangeResult = await pool.query(weekStartQuery);
    const { week_start, week_end } = weekRangeResult.rows[0];

    const leaveStatsQuery = `
      SELECT
        lt.name AS leave_type_name,
        SUM(
          GREATEST(
            LEAST(lr.dateto, $2::date) - GREATEST(lr.datefrom, $1::date) + 1,
            0
          )
        ) AS days_in_week
      FROM leaverequest lr
      JOIN leavetypes lt ON lr.leavetype_id = lt.id
      WHERE lr.status5 = true
        AND lr.dateto >= $1::date
        AND lr.datefrom <= $2::date
      GROUP BY lt.name
      ORDER BY lt.name
    `;

    const leaveStatsResult = await pool.query(leaveStatsQuery, [week_start, week_end]);

    res.status(200).json({
      weekStart: week_start,
      weekEnd: week_end,
      leaveStats: leaveStatsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching weekly leave stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMonthlyLeaveStats = async (req: Request, res: Response) => {
  try {
    const monthParam = parseInt(req.body.month as string);
    if (!monthParam || monthParam < 1 || monthParam > 12) {
      return res.status(400).json({ error: "Invalid or missing 'month' query parameter (1-12)" });
    }

    const year = new Date().getFullYear();

    const monthStart = new Date(year, monthParam - 1, 1);
    const monthEnd = new Date(year, monthParam, 0);

    const monthStartStr = monthStart.toISOString().slice(0, 10);
    const monthEndStr = monthEnd.toISOString().slice(0, 10);

    const leaveStatsQuery = `
      SELECT
        lt.name AS leave_type_name,
        SUM(
          GREATEST(
            LEAST(lr.dateto, $2::date) - GREATEST(lr.datefrom, $1::date) + 1,
            0
          )
        ) AS days_in_month
      FROM leaverequest lr
      JOIN leavetypes lt ON lr.leavetype_id = lt.id
      WHERE lr.status5 = true
        AND lr.dateto >= $1::date
        AND lr.datefrom <= $2::date
      GROUP BY lt.name
      ORDER BY lt.name
    `;

    const leaveStatsResult = await pool.query(leaveStatsQuery, [monthStartStr, monthEndStr]);

    res.status(200).json({
      year,
      month: monthParam,
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
      leaveStats: leaveStatsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching monthly leave stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getYearlyLeaveStats = async (req: Request, res: Response) => {
  try {
    const year = new Date().getFullYear();

    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const leaveStatsQuery = `
      SELECT
        lt.name AS leave_type_name,
        SUM(
          GREATEST(
            LEAST(lr.dateto, $2::date) - GREATEST(lr.datefrom, $1::date) + 1,
            0
          )
        ) AS days_in_year
      FROM leaverequest lr
      JOIN leavetypes lt ON lr.leavetype_id = lt.id
      WHERE lr.status5 = true
        AND lr.dateto >= $1::date
        AND lr.datefrom <= $2::date
      GROUP BY lt.name
      ORDER BY lt.name
    `;

    const leaveStatsResult = await pool.query(leaveStatsQuery, [yearStart, yearEnd]);

    res.status(200).json({
      year,
      leaveStats: leaveStatsResult.rows, 
      // [{ leave_type_name: string, days_in_year: number }, ...]
    });
  } catch (error) {
    console.error("Error fetching yearly leave stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


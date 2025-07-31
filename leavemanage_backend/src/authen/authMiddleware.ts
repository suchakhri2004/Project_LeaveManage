import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/client";
const secret = "backend-Login-2025";

interface RequestWithToken extends Request {
  token?: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    gender: string;
    email: string;
    profile: string;
    signature: string;
    position_id: string;
    position: string;
    affiliation_id: string;
    role: string
  };
}

const AllRoles = (
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) => {
  const tokenHeaders = req.headers.authorization?.split(" ")[1];
  if (!tokenHeaders) {
    res.status(401).send(`Unauthorized: You are not logged in.`);
  } else {
    try {
      const verify = jwt.verify(tokenHeaders, secret) as {
      id: string;
      username: string;
      firstname: string;
      lastname: string;
      gender: string;
      email: string;
      profile: string;
      signature: string;
      position_id: string;
      position: string;
      affiliation_id: string;
      role: string
      };
      req.token = {
      id: verify.id,
      username: verify.username,
      firstname: verify.firstname,
      lastname: verify.lastname,
      gender: verify.gender,
      email: verify.email,
      profile: verify.profile,
      signature: verify.signature,
      position_id: verify.position_id,
      position: verify.position,
      affiliation_id: verify.affiliation_id,
      role: verify.role
      };
      next();
    } catch (err) {
      res.status(401).send(`Unauthorized: Invalid token.`);
    }
  }
};

const RoleEmployee = async (
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) => {
  const tokenHeaders = req.headers.authorization?.split(" ")[1];
  if (!tokenHeaders) {
    return res.status(401).send("Unauthorized: You are not logged in.");
  }

  try {
    const verify = jwt.verify(tokenHeaders, secret) as {
      id: string;
      username: string;
      firstname: string;
      lastname: string;
      gender: string;
      email: string;
      profile: string;
      signature: string;
      position_id: string;
      position: string;
      affiliation_id: string;
      role: string;
    };

    const positionQuery = await pool.query(
      'SELECT roleid FROM position WHERE id = $1',
      [verify.position_id]
    );

    if (positionQuery.rows.length === 0) {
      return res.status(401).send("Unauthorized: No position found.");
    }

    const roleId = positionQuery.rows[0].roleid;

    const roleQuery = await pool.query(
      'SELECT rolename FROM roles WHERE id = $1',
      [roleId]
    );

    if (roleQuery.rows.length === 0 || roleQuery.rows[0].rolename !== 'EMPLOYEE') {
      return res.status(401).send("Unauthorized: You do not have the correct role.");
    }

    req.token = {
      id: verify.id,
      username: verify.username,
      firstname: verify.firstname,
      lastname: verify.lastname,
      gender: verify.gender,
      email: verify.email,
      profile: verify.profile,
      signature: verify.signature,
      position_id: verify.position_id,
      position: verify.position,
      affiliation_id: verify.affiliation_id,
      role: verify.role
    };
    next();
  } catch (err) {
    res.status(401).send("Unauthorized: Invalid token.");
  }
};

const RoleApprove = async (
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) => {
  const tokenHeaders = req.headers.authorization?.split(" ")[1];
  if (!tokenHeaders) {
    return res.status(401).send("Unauthorized: You are not logged in.");
  }

  try {
    // ตรวจสอบและยืนยัน token
    const verify = jwt.verify(tokenHeaders, secret) as {
      id: string;
      username: string;
      firstname: string;
      lastname: string;
      gender: string;
      email: string;
      profile: string;
      signature: string;
      position_id: string;
      position: string;
      affiliation_id: string;
      role: string;
    };

    const positionQuery = await pool.query(
      'SELECT roleid FROM position WHERE id = $1',
      [verify.position_id]
    );

    if (positionQuery.rows.length === 0) {
      return res.status(401).send("Unauthorized: No position found.");
    }

    const roleId = positionQuery.rows[0].roleid;

    const roleQuery = await pool.query(
      'SELECT rolename FROM roles WHERE id = $1',
      [roleId]
    );

    if (roleQuery.rows.length === 0 || roleQuery.rows[0].rolename !== 'APPROVE') {
      return res.status(401).send("Unauthorized: You do not have the correct role.");
    }

    req.token = {
      id: verify.id,
      username: verify.username,
      firstname: verify.firstname,
      lastname: verify.lastname,
      gender: verify.gender,
      email: verify.email,
      profile: verify.profile,
      signature: verify.signature,
      position_id: verify.position_id,
      position: verify.position,
      affiliation_id: verify.affiliation_id,
      role: verify.role,
    };
    next();
  } catch (err) {
    res.status(401).send("Unauthorized: Invalid token.");
  }
};

const RoleSuperAdmin = async (
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) => {
  const tokenHeaders = req.headers.authorization?.split(" ")[1];
  if (!tokenHeaders) {
    return res.status(401).send("Unauthorized: You are not logged in.");
  }

  try {
    const verify = jwt.verify(tokenHeaders, secret) as {
      id: string;
      username: string;
      firstname: string;
      lastname: string;
      gender: string;
      email: string;
      profile: string;
      signature: string;
      position_id: string;
      position: string;
      affiliation_id: string;
      role: string
    };

    const positionQuery = await pool.query(
      'SELECT roleid FROM position WHERE id = $1',
      [verify.position_id]
    );

    if (positionQuery.rows.length === 0) {
      return res.status(401).send("Unauthorized: No position found.");
    }

    const roleId = positionQuery.rows[0].roleid;

    const roleQuery = await pool.query(
      'SELECT rolename FROM roles WHERE id = $1',
      [roleId]
    );

    if (roleQuery.rows.length === 0 || roleQuery.rows[0].rolename !== 'SADMIN') {
      return res.status(401).send("Unauthorized: You do not have the correct role.");
    }

    req.token = {
      id: verify.id,
      username: verify.username,
      firstname: verify.firstname,
      lastname: verify.lastname,
      gender: verify.gender,
      email: verify.email,
      profile: verify.profile,
      signature: verify.signature,
      position_id: verify.position_id,
      position: verify.position,
      affiliation_id: verify.affiliation_id,
      role: verify.role,
    };
    next();
  } catch (err) {
    res.status(401).send("Unauthorized: Invalid token.");
  }
};




export { RequestWithToken, secret, AllRoles,RoleEmployee, RoleApprove, RoleSuperAdmin };

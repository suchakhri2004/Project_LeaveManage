import { pool } from "./client";

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL,
    profile VARCHAR(100),
    signature VARCHAR(100),
    affiliation_id UUID,
    position_id UUID,
    isactive BOOLEAN,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP,
    FOREIGN KEY (affiliation_id) REFERENCES affiliation(id),
    FOREIGN KEY (position_id) REFERENCES position(id)
  );
`;

const createTypesPositionTable = `
  CREATE TABLE IF NOT EXISTS typesposition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leavesick NUMERIC,
    leavebusy NUMERIC,
    leavevacation NUMERIC,
    name VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createRolesTable = `
  CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rolename VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createPositionTable = `
  CREATE TABLE IF NOT EXISTS position (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    positionname VARCHAR(100) NOT NULL,
    typepositionid UUID,
    roleid UUID,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (typepositionid) REFERENCES typesposition(id),
    FOREIGN KEY (roleid) REFERENCES roles(id)
  );
`;

const createAffiliationTable = `
  CREATE TABLE IF NOT EXISTS affiliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createLeaveTypesTable = `
  CREATE TABLE IF NOT EXISTS leavetypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createLeaveRequestTable = `
  CREATE TABLE IF NOT EXISTS leaverequest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numrequest INTEGER,
    subject VARCHAR(255),
    employee_id UUID,
    leavetype_id UUID,
    reason TEXT,
    proof_image_url VARCHAR(500),
    datefrom DATE,
    dateto DATE,
    contact VARCHAR(100),
    responsible_person_id UUID,
    hr_id UUID,
    hr_note TEXT,
    supervisor_id UUID,
    supervisor_note TEXT,
    deputymayor_id UUID,
    deputymayor_note TEXT,
    mayor_id UUID,
    mayor_note TEXT,
    status1 BOOLEAN,
    status1_update TIMESTAMP,
    status2 BOOLEAN,
    status2_update TIMESTAMP,
    status3 BOOLEAN,
    status3_update TIMESTAMP,
    status4 BOOLEAN,
    status4_update TIMESTAMP,
    status5 BOOLEAN,
    status5_update TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (leavetype_id) REFERENCES leavetypes(id),
    FOREIGN KEY (responsible_person_id) REFERENCES users(id),
    FOREIGN KEY (hr_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    FOREIGN KEY (deputymayor_id) REFERENCES users(id),
    FOREIGN KEY (mayor_id) REFERENCES users(id)
  );
`;

const createLeaveBalanceTable = `
  CREATE TABLE IF NOT EXISTS leavebalance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    leavetype_id UUID,
    total_days NUMERIC,
    used_days NUMERIC,
    year INTEGER NOT NULL,
    isactive BOOLEAN,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (leavetype_id) REFERENCES leavetypes(id)
  );
`;

const createOtpTable = `
  CREATE TABLE IF NOT EXISTS otp_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(64) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    reset_token_expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`;

const createPublicHolidaysTable = `
  CREATE TABLE IF NOT EXISTS public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_dates DATE[] NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;




const createTables = async () => {
  try {
    await pool.query(createTypesPositionTable);
    await pool.query(createRolesTable);

    await pool.query(createPositionTable);
    await pool.query(createAffiliationTable);
  
    await pool.query(createUsersTable);

    await pool.query(createLeaveTypesTable);

    await pool.query(createLeaveBalanceTable);
    await pool.query(createLeaveRequestTable);

    await pool.query(createOtpTable);
    await pool.query(createPublicHolidaysTable);

    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

createTables();

import { pool } from '@/db/index.js';

export type RoleRow = {
  id: number;
  name: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export const findRoleByName = async (name: string): Promise<RoleRow | null> => {
  const { rows } = await pool.query<RoleRow>(
    `SELECT * FROM roles WHERE name = $1 LIMIT 1`,
    [name]
  );

  return rows[0] ?? null;
};

export const findRoleById = async (roleId: number): Promise<RoleRow | null> => {
  const { rows } = await pool.query<RoleRow>(
    `SELECT * FROM roles WHERE id = $1 LIMIT 1`,
    [roleId]
  );

  return rows[0] ?? null;
};

export const listRoles = async (): Promise<RoleRow[]> => {
  const { rows } = await pool.query<RoleRow>(
    `SELECT * FROM roles ORDER BY name`
  );

  return rows;
};

export const ensureRole = async (
  name: string,
  isSystem = true
): Promise<RoleRow> => {
  const { rows } = await pool.query<RoleRow>(
    `
    INSERT INTO roles (name, is_system)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE SET is_system = EXCLUDED.is_system, updated_at = now()
    RETURNING *
    `,
    [name, isSystem]
  );

  return rows[0];
};

export const assignRole = async (
  userId: number,
  roleName: string
): Promise<void> => {
  const role = await findRoleByName(roleName);

  if (!role) throw new Error(`Role not found: ${roleName}`);

  await pool.query(
    `
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, role_id) DO NOTHING
    `,
    [userId, role.id]
  );
};

export const revokeRole = async (
  userId: number,
  roleName: string
): Promise<void> => {
  const role = await findRoleByName(roleName);

  if (!role) return;

  await pool.query(
    `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`,
    [userId, role.id]
  );
};

export const getUserRoles = async (userId: number): Promise<string[]> => {
  const { rows } = await pool.query<{ name: string }>(
    `
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
    ORDER BY r.name
    `,
    [userId]
  );

  return rows.map((r) => r.name);
};

export const hasRole = async (
  userId: number,
  roleName: string
): Promise<boolean> => {
  const { rows } = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND r.name = $2
    ) AS exists
    `,
    [userId, roleName]
  );

  return rows[0]?.exists ?? false;
};

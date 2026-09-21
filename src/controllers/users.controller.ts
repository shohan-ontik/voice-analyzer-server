import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createUser, deleteUser, listUsers, resetUserPassword, setUserBanned } from '../services/user.service';

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, tempPassword } = await createUser(req.body);
  res.status(201).json({ ...user.toSafeJSON(), tempPassword });
});

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, q, isBanned } = req.query as unknown as {
    page: number;
    pageSize: number;
    q?: string;
    isBanned?: boolean;
  };
  const result = await listUsers({ page, pageSize, q, isBanned });
  res.json(result);
});

export const resetUserPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, tempPassword } = await resetUserPassword(req.params.id);
  res.json({ ...user.toSafeJSON(), tempPassword });
});

export const banUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await setUserBanned(req.params.id, req.user!.id, true);
  res.json(user);
});

export const unbanUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await setUserBanned(req.params.id, req.user!.id, false);
  res.json(user);
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteUser(req.params.id, req.user!.id);
  res.status(204).send();
});

import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import type { ScenarioKey } from '../models/practiceSession.model';
import {
  createPracticeSession,
  getOwnPracticeSession,
  getOwnStatsSummary,
  listOwnPracticeSessions,
} from '../services/practiceSession.service';

export const createPracticeSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const session = await createPracticeSession(req.user!.id, req.body);
  res.status(201).json(session);
});

export const listOwnPracticeSessionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, scenario } = req.query as unknown as {
    page: number;
    pageSize: number;
    scenario?: ScenarioKey;
  };
  const result = await listOwnPracticeSessions(req.user!.id, { page, pageSize, scenario });
  res.json(result);
});

export const getOwnPracticeSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const session = await getOwnPracticeSession(req.user!.id, req.params.id);
  res.json(session);
});

export const getOwnStatsSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const stats = await getOwnStatsSummary(req.user!.id);
  res.json(stats);
});

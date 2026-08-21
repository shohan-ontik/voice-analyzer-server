import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createTopic, deleteTopic, listActiveTopics, listTopics, updateTopic } from '../services/topic.service';

export const createTopicHandler = asyncHandler(async (req: Request, res: Response) => {
  const topic = await createTopic(req.body);
  res.status(201).json(topic);
});

export const listTopicsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, q, isActive } = req.query as unknown as {
    page: number;
    pageSize: number;
    q?: string;
    isActive?: boolean;
  };
  const result = await listTopics({ page, pageSize, q, isActive });
  res.json(result);
});

export const listActiveTopicsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const topics = await listActiveTopics();
  res.json({ items: topics });
});

export const updateTopicHandler = asyncHandler(async (req: Request, res: Response) => {
  const topic = await updateTopic(req.params.id, req.body);
  res.json(topic);
});

export const deleteTopicHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteTopic(req.params.id);
  res.status(204).send();
});

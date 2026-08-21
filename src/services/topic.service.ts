import { Op } from 'sequelize';
import { Topic } from '../models';
import { ApiError } from '../utils/ApiError';

export async function createTopic(input: { name: string; passage: string }) {
  return Topic.create({ name: input.name, passage: input.passage });
}

export async function listTopics(params: { page: number; pageSize: number; q?: string; isActive?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize's WhereOptions typing doesn't compose well with conditionally-built clauses.
  const where: any = {};
  if (params.q) {
    where.name = { [Op.iLike]: `%${params.q}%` };
  }
  if (typeof params.isActive === 'boolean') {
    where.isActive = params.isActive;
  }

  const { rows, count } = await Topic.findAndCountAll({
    where,
    order: [['createdAt', 'ASC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  });

  return { items: rows, total: count, page: params.page, pageSize: params.pageSize };
}

export async function listActiveTopics() {
  return Topic.findAll({ where: { isActive: true }, order: [['createdAt', 'ASC']] });
}

export async function updateTopic(id: string, patch: { name?: string; passage?: string; isActive?: boolean }) {
  const topic = await Topic.findByPk(id);
  if (!topic) {
    throw ApiError.notFound('Topic not found.');
  }

  if (patch.name !== undefined) topic.name = patch.name;
  if (patch.passage !== undefined) topic.passage = patch.passage;
  if (patch.isActive !== undefined) topic.isActive = patch.isActive;
  await topic.save();

  return topic;
}

export async function deleteTopic(id: string) {
  const topic = await Topic.findByPk(id);
  if (!topic) {
    throw ApiError.notFound('Topic not found.');
  }
  await topic.destroy();
}

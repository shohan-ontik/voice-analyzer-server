import { Op } from 'sequelize';
import { ScoreCategory } from '../models';
import { ApiError } from '../utils/ApiError';

export async function createScoreCategory(input: { name: string }) {
  const existing = await ScoreCategory.findOne({ where: { name: input.name } });
  if (existing) {
    throw ApiError.conflict('A category with this name already exists.');
  }
  return ScoreCategory.create({ name: input.name });
}

export async function listScoreCategories(params: { page: number; pageSize: number; q?: string; isActive?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize's WhereOptions typing doesn't compose well with conditionally-built clauses.
  const where: any = {};
  if (params.q) {
    where.name = { [Op.iLike]: `%${params.q}%` };
  }
  if (typeof params.isActive === 'boolean') {
    where.isActive = params.isActive;
  }

  const { rows, count } = await ScoreCategory.findAndCountAll({
    where,
    order: [['createdAt', 'ASC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  });

  return { items: rows, total: count, page: params.page, pageSize: params.pageSize };
}

export async function listActiveScoreCategories() {
  return ScoreCategory.findAll({ where: { isActive: true }, order: [['createdAt', 'ASC']] });
}

export async function updateScoreCategory(id: string, patch: { name?: string; isActive?: boolean }) {
  const category = await ScoreCategory.findByPk(id);
  if (!category) {
    throw ApiError.notFound('Category not found.');
  }

  if (patch.name !== undefined) {
    const existing = await ScoreCategory.findOne({ where: { name: patch.name } });
    if (existing && existing.id !== id) {
      throw ApiError.conflict('A category with this name already exists.');
    }
    category.name = patch.name;
  }
  if (patch.isActive !== undefined) category.isActive = patch.isActive;
  await category.save();

  return category;
}

export async function deleteScoreCategory(id: string) {
  const category = await ScoreCategory.findByPk(id);
  if (!category) {
    throw ApiError.notFound('Category not found.');
  }
  await category.destroy();
}

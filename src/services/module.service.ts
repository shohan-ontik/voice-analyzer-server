import { Op } from 'sequelize';
import { Exam, LearningMaterial, ModuleChapter, PracticeSession, TrainingModule, UserChapterProgress } from '../models';
import { ApiError } from '../utils/ApiError';

function serializeModule(
  trainingModule: TrainingModule,
  completedAtByChapter: Map<string, Date>,
  bestScoreByExam: Map<string, number>
) {
  const chapters = [...(trainingModule.chapters ?? [])].sort((a, b) => a.order - b.order);
  const exam = trainingModule.exam ?? null;
  const bestScore = exam ? (bestScoreByExam.get(exam.id) ?? null) : null;

  return {
    id: trainingModule.id,
    slug: trainingModule.slug,
    title: trainingModule.title,
    description: trainingModule.description,
    thumbnailUrl: trainingModule.thumbnailUrl,
    order: trainingModule.order,
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      slug: chapter.slug,
      title: chapter.title,
      description: chapter.description,
      order: chapter.order,
      scenario: chapter.scenario,
      materials: [...(chapter.materials ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((material) => ({
          id: material.id,
          type: material.type,
          title: material.title,
          meta: material.meta,
          filename: material.filename,
        })),
      completedAt: completedAtByChapter.get(chapter.id) ?? null,
    })),
    exam: exam && {
      id: exam.id,
      slug: exam.slug,
      title: exam.title,
      moduleLabel: exam.moduleLabel,
      scenario: exam.scenario,
      passMark: exam.passMark,
      dueDate: exam.dueDate,
      bestScore,
      passed: bestScore !== null && bestScore >= exam.passMark,
    },
  };
}

async function attachProgress(modules: TrainingModule[], userId: string) {
  const chapterIds = modules.flatMap((m) => (m.chapters ?? []).map((c) => c.id));
  const examIds = modules.map((m) => m.exam?.id).filter((id): id is string => Boolean(id));

  const [progressRows, examSessions] = await Promise.all([
    chapterIds.length
      ? UserChapterProgress.findAll({ where: { userId, chapterId: chapterIds } })
      : Promise.resolve([]),
    examIds.length
      ? PracticeSession.findAll({ where: { userId, examId: { [Op.in]: examIds } } })
      : Promise.resolve([]),
  ]);

  const completedAtByChapter = new Map<string, Date>();
  for (const row of progressRows) {
    if (row.completedAt) completedAtByChapter.set(row.chapterId, row.completedAt);
  }

  const bestScoreByExam = new Map<string, number>();
  for (const session of examSessions) {
    if (!session.examId) continue;
    const prev = bestScoreByExam.get(session.examId) ?? -1;
    if (session.overallScore > prev) bestScoreByExam.set(session.examId, session.overallScore);
  }

  return modules.map((m) => serializeModule(m, completedAtByChapter, bestScoreByExam));
}

const MODULE_INCLUDE = [
  { model: ModuleChapter, as: 'chapters' as const, include: [{ model: LearningMaterial, as: 'materials' as const }] },
  { model: Exam, as: 'exam' as const },
];

export async function listModulesForUser(userId: string) {
  const modules = await TrainingModule.findAll({
    where: { isActive: true },
    include: MODULE_INCLUDE,
    order: [['order', 'ASC']],
  });

  return attachProgress(modules, userId);
}

export async function getModuleForUser(slug: string, userId: string) {
  const trainingModule = await TrainingModule.findOne({
    where: { slug, isActive: true },
    include: MODULE_INCLUDE,
  });
  if (!trainingModule) {
    throw ApiError.notFound('Module not found.');
  }

  const [serialized] = await attachProgress([trainingModule], userId);
  return serialized;
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return base || 'module';
}

export async function listModulesForAdmin() {
  const modules = await TrainingModule.findAll({
    include: [
      { model: ModuleChapter, as: 'chapters', attributes: ['id'] },
      { model: Exam, as: 'exam', attributes: ['id'] },
    ],
    order: [
      ['order', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  });

  return modules.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description,
    thumbnailUrl: m.thumbnailUrl,
    isActive: m.isActive,
    chapterCount: (m.chapters ?? []).length,
    examCount: m.exam ? 1 : 0,
    updatedAt: m.updatedAt,
  }));
}

export async function getModuleForAdmin(id: string) {
  const trainingModule = await TrainingModule.findByPk(id, {
    include: [
      { model: ModuleChapter, as: 'chapters', include: [{ model: LearningMaterial, as: 'materials' }] },
      { model: Exam, as: 'exam' },
    ],
  });
  if (!trainingModule) {
    throw ApiError.notFound('Module not found.');
  }

  const chapters = [...(trainingModule.chapters ?? [])].sort((a, b) => a.order - b.order);

  return {
    id: trainingModule.id,
    slug: trainingModule.slug,
    title: trainingModule.title,
    description: trainingModule.description,
    thumbnailUrl: trainingModule.thumbnailUrl,
    isActive: trainingModule.isActive,
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      slug: chapter.slug,
      title: chapter.title,
      description: chapter.description,
      materials: [...(chapter.materials ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((material) => ({ id: material.id, type: material.type, title: material.title, meta: material.meta })),
    })),
    exam: trainingModule.exam && {
      id: trainingModule.exam.id,
      title: trainingModule.exam.title,
      passMark: trainingModule.exam.passMark,
      scenario: trainingModule.exam.scenario,
    },
  };
}

export async function createModuleForAdmin(input: { title: string; description?: string; thumbnailUrl?: string }) {
  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop -- sequential by design: each check depends on the previous attempt's result
  while (await TrainingModule.findOne({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const maxOrder = (await TrainingModule.max('order')) as number | null;

  return TrainingModule.create({
    slug,
    title: input.title,
    description: input.description ?? '',
    thumbnailUrl: input.thumbnailUrl ?? null,
    order: (maxOrder ?? -1) + 1,
    isActive: false,
  });
}

export async function updateModuleForAdmin(
  id: string,
  patch: { title?: string; description?: string; thumbnailUrl?: string; isActive?: boolean }
) {
  const trainingModule = await TrainingModule.findByPk(id, {
    include: [
      { model: ModuleChapter, as: 'chapters', attributes: ['id'] },
      { model: Exam, as: 'exam', attributes: ['id'] },
    ],
  });
  if (!trainingModule) {
    throw ApiError.notFound('Module not found.');
  }

  // Publishing a module makes it visible in the trainee-facing app, which
  // assumes every module has at least one chapter and an exam (see
  // getModuleForUser) — block publishing until that's true instead of
  // letting trainees hit a broken module page.
  if (patch.isActive === true && !trainingModule.isActive) {
    const hasChapters = (trainingModule.chapters ?? []).length > 0;
    if (!hasChapters || !trainingModule.exam) {
      throw ApiError.badRequest('Add at least one chapter and an exam before publishing this module.');
    }
  }

  if (patch.title !== undefined) trainingModule.title = patch.title;
  if (patch.description !== undefined) trainingModule.description = patch.description;
  if (patch.thumbnailUrl !== undefined) trainingModule.thumbnailUrl = patch.thumbnailUrl;
  if (patch.isActive !== undefined) trainingModule.isActive = patch.isActive;
  await trainingModule.save();

  return trainingModule;
}

export async function markChapterComplete(userId: string, moduleSlug: string, chapterSlug: string) {
  const chapter = await ModuleChapter.findOne({
    where: { slug: chapterSlug },
    include: [{ model: TrainingModule, as: 'module', where: { slug: moduleSlug }, attributes: [] }],
  });
  if (!chapter) {
    throw ApiError.notFound('Chapter not found.');
  }

  const [progress] = await UserChapterProgress.findOrCreate({
    where: { userId, chapterId: chapter.id },
    defaults: { userId, chapterId: chapter.id, completedAt: new Date() },
  });

  if (!progress.completedAt) {
    progress.completedAt = new Date();
    await progress.save();
  }

  return { completed: true, completedAt: progress.completedAt };
}

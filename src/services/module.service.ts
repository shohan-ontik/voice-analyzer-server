import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import {
  Exam,
  LearningMaterial,
  ModuleChapter,
  PracticeSession,
  TrainingModule,
  UserChapterProgress,
  UserMaterialProgress,
} from '../models';
import type { LearningMaterialType } from '../models/learningMaterial.model';
import type { ChapterScenario } from '../models/moduleChapter.model';
import { ApiError } from '../utils/ApiError';
import { UPLOAD_DIR } from '../utils/uploadPath';

// Fallback only — the admin Module Editor auto-generates a real scenario
// via AI from the chapter's title/description (see the admin app's
// generate-scenario route) and sends it along with create/update requests.
// This placeholder covers the rare case that generation fails or is
// skipped, so the trainee-facing app's PitchScenario fields stay non-null.
const PLACEHOLDER_CHAPTER_SCENARIO: ChapterScenario = {
  clientInitials: '??',
  clientName: 'TBD',
  clientTitle: "TODO: configure this chapter's roleplay scenario",
  objection: 'TODO: add the client objection this chapter should practice against.',
  objective: 'TODO: describe what the rep should accomplish in this roleplay.',
  criteria: [],
};

function unlinkUploadedFile(storageKey: string | null) {
  if (!storageKey) return;
  fs.promises.unlink(path.join(UPLOAD_DIR, storageKey)).catch(() => {
    // Best-effort — an already-missing file shouldn't block the delete.
  });
}

// Mirrors the frontend's getModuleProgressPercent (app/lib/moduleProgress.ts):
// chapters make up 80% of the bar, split evenly across however many chapters
// the module has, and each chapter's own share is in turn split evenly
// across its materials. The final exam makes up the remaining 20%, earned
// only once it's passed.
function calculateModuleProgressPercent(
  chapters: { completedAt: Date | null; materials: { completedAt: Date | null }[] }[],
  examPassed: boolean
): number {
  const total = chapters.length;
  const chapterShare = total === 0 ? 0 : 80 / total;

  const chaptersPercent = chapters.reduce((sum, chapter) => {
    const materialsTotal = chapter.materials.length;
    const chapterFraction =
      materialsTotal === 0
        ? chapter.completedAt !== null
          ? 1
          : 0
        : chapter.materials.filter((m) => m.completedAt !== null).length / materialsTotal;
    return sum + chapterShare * chapterFraction;
  }, 0);

  return Math.round(chaptersPercent + (examPassed ? 20 : 0));
}

// The completedAt/materials shape both serializers feed into
// calculateModuleProgressPercent — the list item doesn't need the rest of
// each chapter's fields, so it's computed straight off the raw models
// instead of via serializeModule's full chapter objects.
function computeChapterCompletion(
  trainingModule: TrainingModule,
  completedAtByChapter: Map<string, Date>,
  completedAtByMaterial: Map<string, Date>
) {
  return (trainingModule.chapters ?? []).map((chapter) => ({
    completedAt: completedAtByChapter.get(chapter.id) ?? null,
    materials: (chapter.materials ?? []).map((material) => ({
      completedAt: completedAtByMaterial.get(material.id) ?? null,
    })),
  }));
}

function serializeModule(
  trainingModule: TrainingModule,
  completedAtByChapter: Map<string, Date>,
  completedAtByMaterial: Map<string, Date>,
  bestScoreByExam: Map<string, number>
) {
  const chapters = [...(trainingModule.chapters ?? [])].sort((a, b) => a.order - b.order);
  const exam = trainingModule.exam ?? null;
  const bestScore = exam ? (bestScoreByExam.get(exam.id) ?? null) : null;
  const examPassed = bestScore !== null && exam !== null && bestScore >= exam.passMark;

  const serializedChapters = chapters.map((chapter) => ({
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
        completedAt: completedAtByMaterial.get(material.id) ?? null,
      })),
    completedAt: completedAtByChapter.get(chapter.id) ?? null,
  }));

  return {
    id: trainingModule.id,
    slug: trainingModule.slug,
    title: trainingModule.title,
    description: trainingModule.description,
    thumbnailUrl: trainingModule.thumbnailUrl,
    order: trainingModule.order,
    chapters: serializedChapters,
    exam: exam && {
      id: exam.id,
      slug: exam.slug,
      title: exam.title,
      moduleLabel: exam.moduleLabel,
      scenario: exam.scenario,
      passMark: exam.passMark,
      dueDate: exam.dueDate,
      bestScore,
      passed: examPassed,
    },
    chapterCount: serializedChapters.length,
    completedChapterCount: serializedChapters.filter((c) => c.completedAt !== null).length,
    progressPercent: calculateModuleProgressPercent(serializedChapters, examPassed),
  };
}

// The list endpoint (GET /modules) drops the full chapters/exam payload —
// trainees only need aggregate counts and the overall percent there; the
// per-chapter/material/exam detail is fetched separately per-module
// (GET /modules/:slug, via serializeModule) once a trainee opens one.
function serializeModuleListItem(
  trainingModule: TrainingModule,
  completedAtByChapter: Map<string, Date>,
  completedAtByMaterial: Map<string, Date>,
  bestScoreByExam: Map<string, number>
) {
  const chaptersCompletion = computeChapterCompletion(trainingModule, completedAtByChapter, completedAtByMaterial);
  const exam = trainingModule.exam ?? null;
  const bestScore = exam ? (bestScoreByExam.get(exam.id) ?? null) : null;
  const examPassed = bestScore !== null && exam !== null && bestScore >= exam.passMark;

  return {
    id: trainingModule.id,
    slug: trainingModule.slug,
    title: trainingModule.title,
    description: trainingModule.description,
    thumbnailUrl: trainingModule.thumbnailUrl,
    order: trainingModule.order,
    chapterCount: chaptersCompletion.length,
    completedChapterCount: chaptersCompletion.filter((c) => c.completedAt !== null).length,
    progressPercent: calculateModuleProgressPercent(chaptersCompletion, examPassed),
  };
}

// Mirrors the frontend's getExamStatus (app/lib/moduleProgress.ts): an exam
// unlocks once every chapter in its module is completed, and stays "passed"
// once a passing attempt exists. Once unlocked, an attempt that didn't reach
// the pass mark shows as "failed" rather than reverting to "ready".
function computeExamStatus(
  examPassed: boolean,
  bestScore: number | null,
  totalChapters: number,
  completedChapters: number
): 'passed' | 'failed' | 'ready' | 'locked' {
  if (examPassed) return 'passed';
  if (totalChapters === 0 || completedChapters < totalChapters) return 'locked';
  return bestScore !== null ? 'failed' : 'ready';
}

// Feeds the /exams page: one entry per module that has an exam, with the
// exam's own data plus its unlock/pass status — modules without an exam are
// skipped rather than returned with a null exam.
function serializeModuleExamItem(
  trainingModule: TrainingModule,
  completedAtByChapter: Map<string, Date>,
  completedAtByMaterial: Map<string, Date>,
  bestScoreByExam: Map<string, number>
) {
  const exam = trainingModule.exam;
  if (!exam) return null;

  const chaptersCompletion = computeChapterCompletion(trainingModule, completedAtByChapter, completedAtByMaterial);
  const totalChapters = chaptersCompletion.length;
  const completedChapters = chaptersCompletion.filter((c) => c.completedAt !== null).length;

  const bestScore = bestScoreByExam.get(exam.id) ?? null;
  const passed = bestScore !== null && bestScore >= exam.passMark;
  const status = computeExamStatus(passed, bestScore, totalChapters, completedChapters);

  return {
    moduleSlug: trainingModule.slug,
    exam: {
      id: exam.id,
      slug: exam.slug,
      title: exam.title,
      moduleLabel: exam.moduleLabel,
      scenario: exam.scenario,
      passMark: exam.passMark,
      dueDate: exam.dueDate,
      bestScore,
      passed,
    },
    status,
  };
}

async function fetchProgressMaps(modules: TrainingModule[], userId: string) {
  const chapterIds = modules.flatMap((m) => (m.chapters ?? []).map((c) => c.id));
  const materialIds = modules.flatMap((m) => (m.chapters ?? []).flatMap((c) => (c.materials ?? []).map((mat) => mat.id)));
  const examIds = modules.map((m) => m.exam?.id).filter((id): id is string => Boolean(id));

  const [progressRows, materialProgressRows, examSessions] = await Promise.all([
    chapterIds.length
      ? UserChapterProgress.findAll({ where: { userId, chapterId: chapterIds } })
      : Promise.resolve([]),
    materialIds.length
      ? UserMaterialProgress.findAll({ where: { userId, materialId: materialIds } })
      : Promise.resolve([]),
    examIds.length
      ? PracticeSession.findAll({ where: { userId, examId: { [Op.in]: examIds } } })
      : Promise.resolve([]),
  ]);

  const completedAtByChapter = new Map<string, Date>();
  for (const row of progressRows) {
    if (row.completedAt) completedAtByChapter.set(row.chapterId, row.completedAt);
  }

  const completedAtByMaterial = new Map<string, Date>();
  for (const row of materialProgressRows) {
    if (row.completedAt) completedAtByMaterial.set(row.materialId, row.completedAt);
  }

  const bestScoreByExam = new Map<string, number>();
  for (const session of examSessions) {
    if (!session.examId) continue;
    const prev = bestScoreByExam.get(session.examId) ?? -1;
    if (session.overallScore > prev) bestScoreByExam.set(session.examId, session.overallScore);
  }

  return { completedAtByChapter, completedAtByMaterial, bestScoreByExam };
}

async function attachProgress(modules: TrainingModule[], userId: string) {
  const { completedAtByChapter, completedAtByMaterial, bestScoreByExam } = await fetchProgressMaps(modules, userId);
  return modules.map((m) => serializeModule(m, completedAtByChapter, completedAtByMaterial, bestScoreByExam));
}

async function attachListProgress(modules: TrainingModule[], userId: string) {
  const { completedAtByChapter, completedAtByMaterial, bestScoreByExam } = await fetchProgressMaps(modules, userId);
  return modules.map((m) => serializeModuleListItem(m, completedAtByChapter, completedAtByMaterial, bestScoreByExam));
}

async function attachExamProgress(modules: TrainingModule[], userId: string) {
  const { completedAtByChapter, completedAtByMaterial, bestScoreByExam } = await fetchProgressMaps(modules, userId);
  return modules
    .map((m) => serializeModuleExamItem(m, completedAtByChapter, completedAtByMaterial, bestScoreByExam))
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

const MODULE_INCLUDE = [
  { model: ModuleChapter, as: 'chapters' as const, include: [{ model: LearningMaterial, as: 'materials' as const }] },
  { model: Exam, as: 'exam' as const },
];

async function fetchActiveModules() {
  return TrainingModule.findAll({
    where: { isActive: true },
    include: MODULE_INCLUDE,
    order: [['order', 'ASC']],
  });
}

export async function listModulesForUser(userId: string, params: { page: number; pageSize: number }) {
  const { rows, count } = await TrainingModule.findAndCountAll({
    where: { isActive: true },
    include: MODULE_INCLUDE,
    order: [['order', 'ASC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
    // Avoids duplicate/undercounted rows from the hasMany `chapters` include.
    distinct: true,
  });

  const items = await attachListProgress(rows, userId);
  const totalPages = Math.ceil(count / params.pageSize);

  return {
    items,
    page: params.page,
    total: count,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

export async function listExamsForUser(userId: string, params: { page: number; pageSize: number }) {
  // Only modules that have an exam are returned (see serializeModuleExamItem),
  // so the exam include is required (inner join) to make DB-level pagination
  // and the total count line up with what's actually returned.
  const { rows, count } = await TrainingModule.findAndCountAll({
    where: { isActive: true },
    include: [
      { model: ModuleChapter, as: 'chapters', include: [{ model: LearningMaterial, as: 'materials' }] },
      { model: Exam, as: 'exam', required: true },
    ],
    order: [['order', 'ASC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
    // Avoids duplicate/undercounted rows from the hasMany `chapters` include.
    distinct: true,
  });

  const items = await attachExamProgress(rows, userId);
  const totalPages = Math.ceil(count / params.pageSize);

  return {
    items,
    page: params.page,
    total: count,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

// A module only counts as completed once every chapter is completed AND its
// exam is passed (mirrors the frontend's getModuleStatus in
// app/lib/moduleProgress.ts) — completion isn't stored anywhere, it's
// derived the same way module-by-module here. Uses the full (detail) shape
// rather than listModulesForUser's slimmed-down list items, since it needs
// each module's exam.passed.
export async function getOwnModuleStats(userId: string) {
  const modules = await fetchActiveModules();
  const detailedModules = await attachProgress(modules, userId);

  let completedModules = 0;
  let passedExams = 0;
  for (const trainingModule of detailedModules) {
    if (trainingModule.exam?.passed) passedExams += 1;

    const totalChapters = trainingModule.chapters.length;
    const completedChapters = trainingModule.chapters.filter((c) => c.completedAt !== null).length;
    if (totalChapters > 0 && completedChapters === totalChapters && trainingModule.exam?.passed) {
      completedModules += 1;
    }
  }

  return { completedModules, passedExams };
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

export async function listModulesForAdmin(params: { page: number; pageSize: number }) {
  const { count, rows } = await TrainingModule.findAndCountAll({
    include: [
      { model: ModuleChapter, as: 'chapters', attributes: ['id'] },
      { model: Exam, as: 'exam', attributes: ['id'] },
    ],
    order: [
      ['order', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
    // Avoids duplicate/undercounted rows from the hasMany `chapters` include.
    distinct: true,
  });

  const items = rows.map((m) => ({
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

  const totalPages = Math.ceil(count / params.pageSize);

  return {
    items,
    page: params.page,
    total: count,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
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
    publishDate: trainingModule.publishDate,
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      slug: chapter.slug,
      title: chapter.title,
      description: chapter.description,
      order: chapter.order,
      materials: [...(chapter.materials ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((material) => ({ id: material.id, type: material.type, title: material.title, meta: material.meta })),
    })),
    exam: trainingModule.exam && {
      id: trainingModule.exam.id,
      title: trainingModule.exam.title,
      passMark: trainingModule.exam.passMark,
      scenario: trainingModule.exam.scenario,
      deadlineDays: trainingModule.exam.deadlineDays,
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
  patch: { title?: string; description?: string; thumbnailUrl?: string; isActive?: boolean; publishDate?: string | null }
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
  if (patch.publishDate !== undefined) trainingModule.publishDate = patch.publishDate;
  await trainingModule.save();

  return trainingModule;
}

export async function deleteModuleForAdmin(id: string) {
  const trainingModule = await TrainingModule.findByPk(id, {
    include: [{ model: ModuleChapter, as: 'chapters', include: [{ model: LearningMaterial, as: 'materials' }] }],
  });
  if (!trainingModule) {
    throw ApiError.notFound('Module not found.');
  }

  for (const chapter of trainingModule.chapters ?? []) {
    for (const material of chapter.materials ?? []) {
      unlinkUploadedFile(material.storageKey);
    }
  }

  // module_chapters, learning_materials, and exams all CASCADE on their
  // moduleId/chapterId FK — practice_sessions referencing this module's
  // chapters/exam SET NULL instead, so trainees' history survives.
  await trainingModule.destroy();
}

export async function createChapterForAdmin(
  moduleId: string,
  input: { title: string; description?: string; scenario?: ChapterScenario }
) {
  const trainingModule = await TrainingModule.findByPk(moduleId);
  if (!trainingModule) {
    throw ApiError.notFound('Module not found.');
  }

  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop -- sequential by design: each check depends on the previous attempt's result
  while (await ModuleChapter.findOne({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const maxOrder = (await ModuleChapter.max('order', { where: { moduleId } })) as number | null;

  return ModuleChapter.create({
    moduleId,
    slug,
    title: input.title,
    description: input.description ?? '',
    scenario: input.scenario ?? PLACEHOLDER_CHAPTER_SCENARIO,
    order: (maxOrder ?? -1) + 1,
  });
}

async function findChapterInModule(moduleId: string, chapterId: string) {
  const chapter = await ModuleChapter.findOne({ where: { id: chapterId, moduleId } });
  if (!chapter) {
    throw ApiError.notFound('Chapter not found.');
  }
  return chapter;
}

export async function updateChapterForAdmin(
  moduleId: string,
  chapterId: string,
  patch: { title?: string; description?: string; scenario?: ChapterScenario }
) {
  const chapter = await findChapterInModule(moduleId, chapterId);
  if (patch.title !== undefined) chapter.title = patch.title;
  if (patch.description !== undefined) chapter.description = patch.description;
  if (patch.scenario !== undefined) chapter.scenario = patch.scenario;
  await chapter.save();
  return chapter;
}

export async function deleteChapterForAdmin(moduleId: string, chapterId: string) {
  const chapter = await ModuleChapter.findOne({
    where: { id: chapterId, moduleId },
    include: [{ model: LearningMaterial, as: 'materials' }],
  });
  if (!chapter) {
    throw ApiError.notFound('Chapter not found.');
  }

  for (const material of chapter.materials ?? []) {
    unlinkUploadedFile(material.storageKey);
  }

  await chapter.destroy();
}

export async function createMaterialForAdmin(
  moduleId: string,
  chapterId: string,
  input: { title: string; type: LearningMaterialType; meta: string; filename: string; storageKey: string; mimeType: string }
) {
  await findChapterInModule(moduleId, chapterId);

  const maxOrder = (await LearningMaterial.max('order', { where: { chapterId } })) as number | null;

  return LearningMaterial.create({
    chapterId,
    type: input.type,
    title: input.title,
    meta: input.meta,
    filename: input.filename,
    storageKey: input.storageKey,
    mimeType: input.mimeType,
    order: (maxOrder ?? -1) + 1,
  });
}

export async function deleteMaterialForAdmin(moduleId: string, chapterId: string, materialId: string) {
  await findChapterInModule(moduleId, chapterId);

  const material = await LearningMaterial.findOne({ where: { id: materialId, chapterId } });
  if (!material) {
    throw ApiError.notFound('Material not found.');
  }

  unlinkUploadedFile(material.storageKey);
  await material.destroy();
}

export async function upsertExamForAdmin(
  moduleId: string,
  patch: { scenario?: string; deadlineDays?: number | null; passMark?: number }
) {
  const trainingModule = await TrainingModule.findByPk(moduleId, { include: [{ model: Exam, as: 'exam' }] });
  if (!trainingModule) {
    throw ApiError.notFound('Module not found.');
  }

  if (trainingModule.exam) {
    const exam = trainingModule.exam;
    if (patch.scenario !== undefined) exam.scenario = patch.scenario;
    if (patch.deadlineDays !== undefined) exam.deadlineDays = patch.deadlineDays;
    if (patch.passMark !== undefined) exam.passMark = patch.passMark;
    await exam.save();
    return exam;
  }

  const baseSlug = `${trainingModule.slug}-final`;
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop -- sequential by design: each check depends on the previous attempt's result
  while (await Exam.findOne({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return Exam.create({
    moduleId,
    slug,
    title: `${trainingModule.title} — Final Exam`,
    moduleLabel: trainingModule.title,
    scenario: patch.scenario ?? '',
    passMark: patch.passMark ?? 80,
    deadlineDays: patch.deadlineDays ?? null,
  });
}

export async function markMaterialComplete(userId: string, moduleSlug: string, chapterSlug: string, materialId: string) {
  const chapter = await ModuleChapter.findOne({
    where: { slug: chapterSlug },
    include: [{ model: TrainingModule, as: 'module', where: { slug: moduleSlug }, attributes: [] }],
  });
  if (!chapter) {
    throw ApiError.notFound('Chapter not found.');
  }

  const materials = await LearningMaterial.findAll({ where: { chapterId: chapter.id } });
  const material = materials.find((m) => m.id === materialId);
  if (!material) {
    throw ApiError.notFound('Material not found.');
  }

  const [progress] = await UserMaterialProgress.findOrCreate({
    where: { userId, materialId: material.id },
    defaults: { userId, materialId: material.id, completedAt: new Date() },
  });

  if (!progress.completedAt) {
    progress.completedAt = new Date();
    await progress.save();
  }

  const materialProgressRows = await UserMaterialProgress.findAll({
    where: { userId, materialId: materials.map((m) => m.id) },
  });
  const completedMaterialIds = new Set(materialProgressRows.filter((row) => row.completedAt).map((row) => row.materialId));
  const chapterCompleted = materials.every((m) => completedMaterialIds.has(m.id));

  if (chapterCompleted) {
    const [chapterProgress] = await UserChapterProgress.findOrCreate({
      where: { userId, chapterId: chapter.id },
      defaults: { userId, chapterId: chapter.id, completedAt: new Date() },
    });
    if (!chapterProgress.completedAt) {
      chapterProgress.completedAt = new Date();
      await chapterProgress.save();
    }
  }

  return { completed: true, completedAt: progress.completedAt, chapterCompleted };
}
